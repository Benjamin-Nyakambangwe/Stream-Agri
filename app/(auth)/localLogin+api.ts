import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    console.log('Local Login API Called1')
  try {

    const { password, mobileAppPasswordHash } = await request.json();
    console.log('password', password)
    console.log('mobileAppPasswordHash', mobileAppPasswordHash)
    // Use bcryptjs to compare passwords (this works because we're in Node.js)
    const isMatch = await bcrypt.compare(password, mobileAppPasswordHash);
    console.log('hashed')
    console.log(isMatch)
    
    return new Response(JSON.stringify({ isMatch }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    console.log('error', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}