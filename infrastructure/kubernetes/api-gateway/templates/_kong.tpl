{{- define "api-gateway.kongDeclarative" -}}
_format_version: "3.0"

consumers:
  - username: {{ .Values.jwt.consumerUsername | quote }}
    jwt_secrets:
      - algorithm: RS256
        key: {{ .Values.jwt.jwtKey | quote }}
        rsa_public_key: |
{{ .Values.jwt.rsaPublicKey | nindent 10 }}

services:
  - name: user-service-auth
    url: http://{{ .Values.upstreams.user.host }}:{{ .Values.upstreams.user.port }}/auth
    routes:
      - name: user-auth
        paths:
          - /api/auth
        strip_path: true

  - name: user-service-users
    url: http://{{ .Values.upstreams.user.host }}:{{ .Values.upstreams.user.port }}/users
    routes:
      - name: user-users
        paths:
          - /api/users
        strip_path: true
        plugins:
          - name: jwt
            config:
              uri_param_names: []
              header_names:
                - authorization
              claims_to_verify:
                - exp
              key_claim_name: iss
          - name: rate-limiting
            config:
              second: 30
              policy: local
              limit_by: consumer
              fault_tolerant: true

  - name: product-service-products
    url: http://{{ .Values.upstreams.product.host }}:{{ .Values.upstreams.product.port }}/products
    routes:
      - name: product-products
        paths:
          - /api/products
        strip_path: true

  - name: product-service-categories
    url: http://{{ .Values.upstreams.product.host }}:{{ .Values.upstreams.product.port }}/categories
    routes:
      - name: product-categories
        paths:
          - /api/categories
        strip_path: true

  - name: order-service
    url: http://{{ .Values.upstreams.order.host }}:{{ .Values.upstreams.order.port }}
    routes:
      - name: order-api
        paths:
          - /api/orders
        strip_path: false
        plugins:
          - name: jwt
            config:
              uri_param_names: []
              header_names:
                - authorization
              claims_to_verify:
                - exp
              key_claim_name: iss
          - name: rate-limiting
            config:
              second: 30
              policy: local
              limit_by: consumer
              fault_tolerant: true

  - name: payment-service
    url: http://{{ .Values.upstreams.payment.host }}:{{ .Values.upstreams.payment.port }}
    routes:
      - name: payment-provider-callbacks
        paths:
          - /api/payments/payme/callback
          - /api/payments/click/callback
          - /api/payments/uzcard/callback
        strip_path: false
        methods:
          - POST
        regex_priority: 100
      - name: payment-api
        paths:
          - /api/payments
        strip_path: false
        plugins:
          - name: jwt
            config:
              uri_param_names: []
              header_names:
                - authorization
              claims_to_verify:
                - exp
              key_claim_name: iss
          - name: rate-limiting
            config:
              second: 30
              policy: local
              limit_by: consumer
              fault_tolerant: true

  - name: delivery-service
    url: http://{{ .Values.upstreams.delivery.host }}:{{ .Values.upstreams.delivery.port }}/delivery
    routes:
      - name: delivery-api
        paths:
          - /api/delivery
        strip_path: true

  - name: search-service
    url: http://{{ .Values.upstreams.search.host }}:{{ .Values.upstreams.search.port }}
    routes:
      - name: search-api
        paths:
          - /api/search
        strip_path: false

  - name: notification-service
    url: http://{{ .Values.upstreams.notification.host }}:{{ .Values.upstreams.notification.port }}
    routes:
      - name: notification-rest
        paths:
          - /api/notifications
        strip_path: false
        plugins:
          - name: jwt
            config:
              uri_param_names: []
              header_names:
                - authorization
              claims_to_verify:
                - exp
              key_claim_name: iss
          - name: rate-limiting
            config:
              second: 30
              policy: local
              limit_by: consumer
              fault_tolerant: true
      - name: notification-ws
        paths:
          - /ws/notifications
        strip_path: false
      - name: notification-socket-io
        paths:
          - /socket.io
        strip_path: false

  - name: media-service
    url: http://{{ .Values.upstreams.media.host }}:{{ .Values.upstreams.media.port }}/media
    routes:
      - name: media-mutations
        paths:
          - /api/media
        strip_path: true
        methods:
          - POST
          - DELETE
          - PUT
          - PATCH
        plugins:
          - name: jwt
            config:
              uri_param_names: []
              header_names:
                - authorization
              claims_to_verify:
                - exp
              key_claim_name: iss
          - name: rate-limiting
            config:
              second: 30
              policy: local
              limit_by: consumer
              fault_tolerant: true
      - name: media-read
        paths:
          - /api/media
        strip_path: true
        methods:
          - GET
          - HEAD

plugins:
  - name: cors
    config:
      origins:
{{- range .Values.cors.origins }}
        - {{ . | quote }}
{{- end }}
      methods:
        - GET
        - HEAD
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Authorization
        - Content-Type
        - X-Request-Id
      exposed_headers:
        - X-Request-Id
      credentials: true
      max_age: 3600

  - name: correlation-id
    config:
      header_name: X-Request-Id
      generator: uuid
      echo_downstream: true

  - name: rate-limiting
    config:
      second: 100
      policy: local
      limit_by: ip
      fault_tolerant: true
{{- end }}
