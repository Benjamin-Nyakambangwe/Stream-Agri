import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as jose from 'jose';

// Secret key for JWT signing - in production, use a secure environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.EXPO_PUBLIC_JWT_SECRET);
const JWT_EXPIRY = '30d'; // JWT will expire in 30 days

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
      
      // Generate JWT with employee details
      const jwt = await new jose.SignJWT({
        sub: employeeData.id.toString(),
        user_id: employeeData.id,
        iss: "https://powersync-api.journeyapps.com",
        aud: "https://67f6c16f984c6f4cb07959ca.powersync.journeyapps.com",
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(JWT_SECRET);
      
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