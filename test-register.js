
const { register } = require('./app/actions');

async function testRegister() {
    const result = await register({
        name: "Test User",
        email: `test_${Date.now()}@example.com`,
        password: "Password@123!", // Valid according to new policy
        orgName: "Test Org",
        cedula: "123456789",
        plan: "STARTER"
    });
    console.log('Registration result:', result);
}

testRegister().catch(console.error);
