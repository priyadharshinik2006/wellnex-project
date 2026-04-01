async function testLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'priyadharshini.k2345@gmail.com', 
        password: 'Priya@123' 
      })
    });
    const data = await res.json();
    console.log('Login Status:', res.status);
    console.log('Login Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testLogin();
