import fetch from 'node-fetch';

class Login {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.website_headers = {
      "accept": "application/json, text/plain, */*",
      "Content-Type": "application/json"
    };
  }

  async login() {
    const url = 'https://api.getgrass.io/login';

    const json_data = {
      username: this.email,
      password: this.password,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.website_headers,
        body: JSON.stringify(json_data)
      });

      const res_json = await response.json();
      if (res_json.result && res_json.result.data && res_json.result.data.accessToken) {
        const authToken = res_json.result.data.accessToken;
        console.debug(`Login response: ${authToken}`);
        return authToken;
      } else {
        throw new Error('Invalid login response');
      }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}


const email = 'EMAIL Grass';
const password = 'PASSWORD Grass';

const loginInstance = new Login(email, password);

loginInstance.login()
  .then(authToken => {
    console.log('Authorization Token:', authToken);
  })
  .catch(error => {
    console.error('Login gagal:', error);
  });
