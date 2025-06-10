// app/api/jwks+api.ts
export async function GET(request: Request) {
    const jwk = {
      "kty": "RSA",
      "n": "xO9wuC-5iNlPB8tme7Pmm5JzdUxsoYbwXfKPa2LS2w6fLOlIhi5H30SSne-aaNZ4kS0xT8NhWmVCHBCFMQVYqIUKMOJcqTg6I68I9W88-VrZUGij4YN1Ac6Hgfq__wu0R1mv8DFHcJj-7M3mQ_DtiRaWX43AlYR3t84PTUxn-CzLQLAAOYP083uftu5JGNfwfMQ0eUcxvy6InbCvy1N6w1mSr-XrC277uTvjgGKQLOrltqZHV0aWWVJX8RXotl8-Ub7Jkn1gxkmgs4Wn6ddTLSMES3Zf9F0pCj7ki8RcINYrIQ7AKt3_TiugE-nRNJididnqNWQ4zEPSCJgxfhercQ",
      "e": "AQAB",
      "alg": "RS256",
      "kid": "rn-powersync-2024"
    };
    
    return Response.json({
      keys: [jwk]
    });
  }