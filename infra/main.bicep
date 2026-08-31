// Lease & Loan Abstraction — Azure infrastructure
//
// Deploys: App Service (Linux/Node) running the Next.js app, Azure Database
// for PostgreSQL Flexible Server, a Storage Account (Blob) for source
// documents, an Azure OpenAI account + chat deployment for the AI
// abstraction/Q&A layer, Key Vault for secrets, and Log Analytics +
// Application Insights for observability. Deploy at resource-group scope:
//
//   az group create --name rg-lease-abstract --location eastus2
//   az deployment group create --resource-group rg-lease-abstract \
//     --template-file infra/main.bicep --parameters infra/main.parameters.example.json
//
// See infra/README.md for the full walkthrough, including first-run
// migration/seed and switching AI_PROVIDER/STORAGE_DRIVER from local to
// Azure-backed.

@description('Short name used as a prefix for all resources, e.g. "leaseabs".')
@minLength(3)
@maxLength(16)
param namePrefix string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('''Azure region for the PostgreSQL Flexible Server, if it needs to differ
from `location`. Postgres Flexible Server provisioning can be regionally
restricted for a subscription even when other resource types (App Service,
Storage, etc.) work fine in that same region — check with:
  az postgres flexible-server list-skus --location <region> -o json
and look for a top-level "reason" field mentioning a restriction, or an
empty "supportedServerEditions"/"supportedServerVersions" at the top level.
Leave blank to use the same region as everything else (`location`).''')
param postgresLocation string = ''

var resolvedPostgresLocation = empty(postgresLocation) ? location : postgresLocation

@description('Administrator username for the PostgreSQL Flexible Server.')
param postgresAdminLogin string = 'leaseabstract'

@secure()
@description('Administrator password for the PostgreSQL Flexible Server.')
param postgresAdminPassword string

@description('App Service Plan SKU. B1 is fine for a pilot; move to P0v3+ for production.')
param appServicePlanSku string = 'B1'

@description('Azure OpenAI SKU.')
param openAiSku string = 'S0'

@description('Azure OpenAI chat model deployment name (also used as the model name).')
param openAiChatDeployment string = 'gpt-4o'

@description('''Azure OpenAI model version for the chat deployment. Model versions are
retired on a rolling basis, so there is no safe hardcoded default here.
Find a currently-available version for your subscription/region with:
  az cognitiveservices account list-models --name <openAiAccountName> --resource-group <rg> -o table
(the account name is the deployment output `openAiEndpoint`'s host prefix, or
`az cognitiveservices account list --resource-group <rg> --query "[?kind=='OpenAI'].name" -o tsv`
if you need to look it up). Pass the chosen value as
--parameters openAiChatModelVersion=<version>. Only required when
deployOpenAiChatModel is true (the default) — leave blank if you're setting
deployOpenAiChatModel=false to skip this resource and run on Claude instead.''')
param openAiChatModelVersion string = ''

@description('''Capacity (in thousands of tokens/minute) for the chat deployment.
Check the MaxCapacity column from the list-models command above for this
model/region/subscription before raising this — a value above what your
subscription allows will fail the deployment the same way a bad quota did.''')
param openAiChatCapacity int = 1

@description('''Deployment SKU for the chat model (the "deployment type" in Azure OpenAI
Studio: Standard, GlobalStandard, DataZoneStandard, ProvisionedManaged, ...).
Newer models are often GlobalStandard-only; check the error message if a
deployment rejects this, or look at the model's available deployment types
in the Azure AI Foundry portal.''')
param openAiChatDeploymentSku string = 'GlobalStandard'

@description('Deploy an Azure AI Document Intelligence account for layout/OCR extraction with bounding boxes.')
param deployDocumentIntelligence bool = true

@description('''Deploy the Azure OpenAI chat MODEL deployment (the piece that consumes
tokens-per-minute quota and is the most quota-restricted resource in this
template). The Azure OpenAI ACCOUNT is always created regardless (it needs
no quota) so its endpoint/key are still available. Set to false — typically
paired with aiProvider=claude and anthropicApiKey set — to skip straight
past Azure OpenAI capacity/quota issues entirely and run on Claude instead.''')
param deployOpenAiChatModel bool = true

@description('''Which AI backend the app uses at runtime: "azure" (Azure OpenAI,
provisioned by this template either way) or "claude" (the Claude API/Anthropic
directly). Only meaningful when anthropicApiKey is also supplied for "claude".''')
@allowed(['azure', 'claude'])
param aiProvider string = 'azure'

@secure()
@description('''Anthropic API key, if using Claude as the AI provider instead of (or
alongside) Azure OpenAI. Leave blank to skip provisioning this — the app
falls back to Azure OpenAI or the mock provider. Get a key from
https://console.anthropic.com/settings/keys.''')
param anthropicApiKey string = ''

@description('Anthropic model ID for the chat/extraction calls, when anthropicApiKey is set.')
param anthropicModel string = 'claude-opus-5'

var uniqueSuffix = uniqueString(resourceGroup().id)
var resourceName = '${namePrefix}${uniqueSuffix}'
var storageAccountName = toLower(substring('${namePrefix}st${uniqueSuffix}', 0, min(24, length('${namePrefix}st${uniqueSuffix}'))))
var documentsContainerName = 'documents'

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'log-${resourceName}'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${resourceName}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ---------------------------------------------------------------------------
// Storage (source documents)
// ---------------------------------------------------------------------------

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storage
  name: 'default'
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: documentsContainerName
  properties: {
    publicAccess: 'None'
  }
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: 'psql-${resourceName}'
  location: resolvedPostgresLocation
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
  }
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgres
  name: 'leaseabstract'
}

// Allow Azure services (App Service) to reach the flexible server. Lock this
// down to specific outbound IPs / a VNet integration for production.
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---------------------------------------------------------------------------
// AI: Azure OpenAI (abstraction extraction + Ask AI chat)
// ---------------------------------------------------------------------------

resource openAi 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: 'oai-${resourceName}'
  location: location
  kind: 'OpenAI'
  sku: { name: openAiSku }
  properties: {
    customSubDomainName: 'oai-${resourceName}'
    publicNetworkAccess: 'Enabled'
  }
}

resource openAiChatModel 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = if (deployOpenAiChatModel) {
  parent: openAi
  name: openAiChatDeployment
  sku: {
    name: openAiChatDeploymentSku
    capacity: openAiChatCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: openAiChatDeployment
      version: openAiChatModelVersion
    }
    // Once deployed, let Azure roll this deployment onto the new default
    // version automatically as old ones retire, instead of hard-failing.
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
  }
}

// ---------------------------------------------------------------------------
// AI: Azure AI Document Intelligence (layout/OCR with bounding boxes) — optional
// ---------------------------------------------------------------------------

resource documentIntelligence 'Microsoft.CognitiveServices/accounts@2023-05-01' = if (deployDocumentIntelligence) {
  name: 'di-${resourceName}'
  location: location
  kind: 'FormRecognizer'
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: 'di-${resourceName}'
    publicNetworkAccess: 'Enabled'
  }
}

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${resourceName}'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DATABASE-URL'
  properties: {
    value: 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/leaseabstract?sslmode=require'
  }
}

resource storageConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AZURE-STORAGE-CONNECTION-STRING'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
  }
}

resource openAiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AZURE-OPENAI-API-KEY'
  properties: {
    value: openAi.listKeys().key1
  }
}

resource anthropicKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(anthropicApiKey)) {
  parent: keyVault
  name: 'ANTHROPIC-API-KEY'
  properties: {
    value: anthropicApiKey
  }
}

// ---------------------------------------------------------------------------
// App Service (the Next.js application)
// ---------------------------------------------------------------------------

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-${resourceName}'
  location: location
  sku: { name: appServicePlanSku }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: 'app-${resourceName}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'npm run start'
      appSettings: [
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'DATABASE_URL', value: '@Microsoft.KeyVault(SecretUri=${databaseUrlSecret.properties.secretUri})' }
        { name: 'STORAGE_DRIVER', value: 'azure' }
        { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storage.name }
        { name: 'AZURE_STORAGE_CONTAINER', value: documentsContainerName }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(SecretUri=${storageConnectionStringSecret.properties.secretUri})'
        }
        { name: 'AI_PROVIDER', value: aiProvider }
        { name: 'AZURE_OPENAI_ENDPOINT', value: openAi.properties.endpoint }
        { name: 'AZURE_OPENAI_API_KEY', value: '@Microsoft.KeyVault(SecretUri=${openAiKeySecret.properties.secretUri})' }
        { name: 'AZURE_OPENAI_DEPLOYMENT_CHAT', value: openAiChatDeployment }
        { name: 'AZURE_OPENAI_API_VERSION', value: '2024-08-01-preview' }
        {
          name: 'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT'
          value: deployDocumentIntelligence ? documentIntelligence.properties.endpoint : ''
        }
        {
          name: 'ANTHROPIC_API_KEY'
          value: !empty(anthropicApiKey) ? '@Microsoft.KeyVault(SecretUri=${anthropicKeySecret.properties.secretUri})' : ''
        }
        { name: 'ANTHROPIC_MODEL', value: anthropicModel }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        // Both must match: WEBSITES_PORT tells App Service's proxy which port to
        // route to, and PORT is what `next start` actually binds to. Leaving only
        // one set lets them drift (Azure's own auto-injected PORT for the Node
        // runtime doesn't reliably match a manually-set WEBSITES_PORT), which
        // shows up as "worker process failed to start within the allotted time"
        // even though the app itself started fine on the "wrong" port.
        { name: 'WEBSITES_PORT', value: '3000' }
        { name: 'PORT', value: '3000' }
      ]
    }
  }
}

// ---------------------------------------------------------------------------
// RBAC: let the App Service's managed identity read Key Vault secrets and
// write/read blobs directly (defense in depth alongside the connection
// string app setting; either is sufficient on its own).
// ---------------------------------------------------------------------------

var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, webApp.id, storageBlobDataContributorRoleId)
  scope: storage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

output webAppName string = webApp.name
output webAppHostName string = webApp.properties.defaultHostName
output postgresServerFqdn string = postgres.properties.fullyQualifiedDomainName
output storageAccountName string = storage.name
output openAiEndpoint string = openAi.properties.endpoint
output documentIntelligenceEndpoint string = deployDocumentIntelligence ? documentIntelligence.properties.endpoint : ''
output keyVaultName string = keyVault.name
