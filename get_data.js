import fetch from 'node-fetch';

class DataFetcher {
  constructor() {
    this.website_headers = {
      "accept": "application/json, text/plain, */*",
      "Content-Type": "application/json"
    };
  }

  async getData(authHeader) {
    const url = 'https://api.getgrass.io/epochEarnings?input=%7B%22limit%22:1,%22isLatestOnly%22:true%7D';

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.website_headers,
          "authorization": authHeader
        }
      });

      const res_text = await response.text();
      console.debug(`Get Data response: ${res_text}`);

      const res_json = await response.json();
      if (res_json.error) {
        throw new Error(`Get Data error: ${res_json.error.message}`);
      }

      if (response.status !== 200) {
        throw new Error(`Get Data response: | ${res_text}`);
      }

      return res_json;

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}


const authHeader = 'auth token grass'; // Ganti dengan token otorisasi yang didapat dari login

const dataFetcher = new DataFetcher();

dataFetcher.getData(authHeader)
  .then(data => {
    console.log('Data berhasil didapatkan:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
