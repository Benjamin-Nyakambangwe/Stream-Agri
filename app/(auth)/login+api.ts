import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';



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
    console.log('API response data:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    // Return the response data
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