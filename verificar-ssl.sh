#!/bin/bash

echo "🔍 Verificando certificado SSL de koptup.com..."
echo ""
echo "📌 Verificando www.koptup.com:"
openssl s_client -connect www.koptup.com:443 -servername www.koptup.com 2>/dev/null | openssl x509 -noout -text | grep -A2 "Subject:\|DNS:"
echo ""
echo "📌 Verificando koptup.com:"
openssl s_client -connect koptup.com:443 -servername koptup.com 2>/dev/null | openssl x509 -noout -text | grep -A2 "Subject:\|DNS:"
echo ""
echo "✅ Si ves 'DNS:www.koptup.com' y 'DNS:koptup.com', el certificado está correcto"
