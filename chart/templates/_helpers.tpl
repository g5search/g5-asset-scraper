{{/*
Expand the name of the chart.
*/}}
{{- define "asset-scraper.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "asset-scraper.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "asset-scraper.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "asset-scraper.labels" -}}
helm.sh/chart: {{ include "asset-scraper.chart" . }}
{{ include "asset-scraper.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "asset-scraper.selectorLabels" -}}
app.kubernetes.io/name: {{ include "asset-scraper.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "asset-scraper.serviceAccountName" -}}
{{- default (include "asset-scraper.fullname" .) .Release.Name }}
{{- end }}

{{- define "asset-scraper.gsaName" -}}
{{ include "cloud-helper.gcp.safeGSAName" .Release.Name }}
{{- end }}

{{- define "validate-configuration" }}
{{- if not .Values.configuration }}
{{ fail "a configuration is required!" }}
{{- end }}
{{- if not (hasKey .Values.configurations .Values.configuration) }}
{{ fail (printf "%s is not a defined configuration in %v" .Values.configuration (keys .Values.configurations)) }}
{{- end }}
{{- end }}

{{- define "publicHostname" }}
{{- include "validate-configuration" . }}
{{- $configuration := index .Values.configurations .Values.configuration -}}
{{- $defaultPublicHostname := printf "%s-%s.g5devops.com" .Release.Name .Values.environment -}}
{{- if eq .Values.configuration "production" -}}
  {{- $defaultPublicHostname = printf "%s.g5marketingcloud.com" .Release.Name -}}
{{- end }}
{{- $configuration.publicHostname | default $defaultPublicHostname -}}
{{ end }}
