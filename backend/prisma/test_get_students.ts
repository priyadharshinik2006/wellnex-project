async function testGetStudents() {
  try {
    // 1. Login as Admin first to get token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'priyadharshini.k2345@gmail.com', 
        password: 'Priya@2468' 
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
        console.error('Login failed, no token.');
        return;
    }

    // 2. Fetch students
    const res = await fetch('http://localhost:5000/api/faculty/students', {
      headers: { 
          'Authorization': `Bearer ${token}` 
      }
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Students Found:', data.length);
    if (data.length > 0) {
        console.log('First Student Sample:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testGetStudents();
