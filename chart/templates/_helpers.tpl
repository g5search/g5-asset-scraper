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
