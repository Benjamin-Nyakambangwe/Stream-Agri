import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as jose from 'jose';
import { SignJWT, importPKCS8 } from 'jose';

// Secret key for JWT signing - in production, use a secure environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.EXPO_PUBLIC_JWT_SECRET);
const JWT_EXPIRY = '30d'; // JWT will expire in 30 days
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDE73C4L7mI2U8H
y2Z7s+abknN1TGyhhvBd8o9rYtLbDp8s6UiGLkffRJKd75po1niRLTFPw2FaZUIc
EIUxBViohQow4lypODojrwj1bzz5WtlQaKPhg3UBzoeB+r//C7RHWa/wMUdwmP7s
zeZD8O2JFpZfjcCVhHe3zg9NTGf4LMtAsAA5g/Tze5+27kkY1/B8xDR5RzG/Loid
sK/LU3rDWZKv5esLbvu5O+OAYpAs6uW2pkdXRpZZUlfxFei2Xz5RvsmSfWDGSaCz
hafp11MtIwRLdl/0XSkKPuSLxFwg1ishDsAq3f9OK6AT6dE0mJ2J2eo1ZDjMQ9II
mDF+F6txAgMBAAECggEAAXfhTayNS71+yhc5ZG23Wl0RkrpbdaaZ28mzA7VzYiA1
8veiuCNT7JxEcHxu+anDNS3jJ5S9M03GW/96vvuANPJKjyzV97DWEWfjokkvUdit
wG/b5LG8aWVLXNS2Bv18D77ZufGOidgdz8lK2HemdjaLN5dgSUAA4DJL/7pPwiHm
MVpHsAVIUkM94oxQA9yBfVzfQiGP0fYnChvYJGm1mUO/MKCR49a1omQPYyeyps9R
nZC8BDQ3ngFf076Ge+mEWXTmcXxHC2UwNPl4X/wZyCHHzeigAsjq0zz5Y8Kr1pjw
v0jgH/v3egDDNdOawOWk8RvGFZr1UbxS9xQ18vyuuQKBgQDt9XsEXTA1GUGu6Uly
RGJCk4swXuoZmB0AWUTZ7eiNkc4aX5mX94hKbMl1GQaZQ8zuaSD3M/HHo6Gia7/c
oEczaX8apun582SYeQZU1LlUCRZ2laScziOMSF+TM41KL53NDMQ0S3yd1oB5KY3K
+i+KdV6dal7VnoULDZ2hA68NZQKBgQDT3by03MN3sa8648iJOtwe8N5CH2lOGLbw
z9Ru171+ceznXzqQzDjsRlP0GxNqQ9Or6yZB69DdU5H7CY2fSzlVW5p2NLbObCWw
6PVTamkMRJAryc4fAI5b3DacaZ+czMfUR9lnCo5Y9zKuS4Rrcp5428r8bydCeYsx
UO/hcpubHQKBgFiGc557AJ0waTQmC7Hb6OY1t5lmJhchdOCVVTzx+gr4zEEZga18
ZBK0B/ptNfw8sfeb2qy8gV0w7cfb6AOvCO4CeEu0/uSC/NCQbZ+Ph+bQfq/dGeFP
+v+MSSodCponvr/y2OdPkeuyShdJMzvo+Vi8M1fCo8c68unaxeKJ2UzVAoGACiuY
xW3bjEFhUghhNgU3T9zsLmxnl7IkBgdUAUYl+I3re2fc3dqP2Pe/S/aIxg8feB8/
pOZ3DkjWtyBMRhtMU0akcYwyQlJ6tLVaIXj4NfiMmy2C0YYrT0mQ7Y08dkB2T0Br
tUCSeL7VFfzWDHpiFRcn9Vo4nj5LakCiY0YnJhkCgYAG7qTSP26EUX1qehS3gNZn
Rpw5LfY3RYnD62dXLD5KNAFi1/Tn5J15qLoucVuZuOrpvNLE9NkdvgnFyrkNRH+2
kkYCHMFM1rbim5D6dH7JCgqxfKAyxvGqeVBoqTlwoqo/FRS5GtfVwSD2mjjL0ZJx
zzlnApwpL6x+HcYX0xvmBg==
-----END PRIVATE KEY-----`;

export async function POST(request: Request) {
  console.log('Odoo Employee Login API Called');
  
  try {
    const { phoneNumber, password, apiBaseUrl } = await request.json();
    console.log('phone_number', phoneNumber);
    console.log('apiBaseUrl', apiBaseUrl);
       
    const options = {
      method: 'POST',
      url: `${apiBaseUrl}/api/fo/login`,
      headers: {
        cookie: 'frontend_lang=en_GB; session_id=-K5HKltBHNwTvX4TgvrlPH7FlEqdtGKTmHboa6HvN39EmSTalZnMU_5fqPITigHoM8HeXW0TorV1r5Xfd5mR',
        'Content-Type': 'application/json',
      },
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          phone_number: phoneNumber,
          password,
          device_info: {
            deviceModel: Device.modelName || 'Unknown', 
            deviceName: Device.deviceName || 'Unknown'
          }
        }
      }
    };

    console.log('Sending request to:', options.url);
    console.log('Request payload:', JSON.stringify(options.data));
    
    // Make the request to the Odoo API
    const response = await axios.request(options);
    console.log('API response status:', response.status);
    console.log('API response data:', JSON.stringify(response.data));
    
    // If login is successful, generate JWT
    if (response.data?.result?.success) {
      const employeeData = response.data.result.employee;
      const sessionToken = response.data.result.session_token;



      const privateKey = await importPKCS8(PRIVATE_KEY, 'RS256');

      
      // Generate JWT with employee details
      // const jwt = await new jose.SignJWT({
      //   sub: employeeData.id.toString(),
      //   user_id: employeeData.id,
      //   iss: "https://powersync-api.journeyapps.com",
      //   aud: "https://67f6c16f984c6f4cb07959ca.powersync.journeyapps.com",
      //   iat: Math.floor(Date.now() / 1000),
      //   exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days in seconds

      // })
      //   .setProtectedHeader({ alg: 'HS256' })
      //   .setIssuedAt()
      //   .setExpirationTime(JWT_EXPIRY)
      //   .sign(JWT_SECRET);

      const jwt = await new SignJWT({
        sub: employeeData.id.toString(),
        user_id: employeeData.id,
        iss: "https://powersync-api.journeyapps.com",
        aud: "https://67f6c16f984c6f4cb07959ca.powersync.journeyapps.com",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
      })
        .setProtectedHeader({ 
          alg: 'RS256',
          kid: 'rn-powersync-2024' // Must match the kid in your JWKS
        })
        .sign(privateKey);

      console.log('JWT:', jwt);
      // return jwt;
      
      // Return JWT along with the response data
      return new Response(JSON.stringify({
        ...response.data,
        jwt
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Return the original response if login wasn't successful
    return new Response(JSON.stringify(response.data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error: any) {
    console.log('API error:', error);
    let errorMessage = error.message;
    let statusCode = 500;
    
    // Check if it's an Axios error with a response
    if (error.response) {
      errorMessage = error.response.data?.error || error.message;
      statusCode = error.response.status || 500;
      console.log('Response error data:', error.response.data);
    }
    
    // Log more detailed information about the error
    console.log('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.response?.data || 'No additional details'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: statusCode
    });
  }
}