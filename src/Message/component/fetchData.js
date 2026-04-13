import axios from 'axios';

const fetchData = async (storedUserId, messageId, offset = 0, limit = 20) => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_SERVER}/messages/${storedUserId}/${messageId}?offset=${offset}&limit=${limit}`
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export default fetchData;
