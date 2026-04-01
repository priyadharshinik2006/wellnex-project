import fetch from 'node-fetch';

async function testSurvey() {
  try {
    // 1. Get a token by logging in
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@university.edu', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      console.log('Login failed:', loginData);
      return;
    }

    // 2. Submit high risk survey
    console.log('Submitting high risk survey to trigger email alert...');
    const surveyRes = await fetch('http://localhost:5000/api/student/survey', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        stressLevel: 9,
        sleepQuality: 1,
        academicPressure: 9,
        mood: 'Anxious',
        comments: 'Very stressed'
      })
    });
    
    const surveyData = await surveyRes.json();
    console.log('Survey Response Status:', surveyRes.status);
    console.log('Survey Response Body:', surveyData);

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testSurvey();
