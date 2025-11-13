export async function getSensorData() {
  try {
    const response = await fetch('http://localhost:5000/sensors');
    const data = await response.json();
    return data;  // [{id:1, name:'Temp', value:25}, ...]
  } catch (err) {
    console.error(err);
    return [];
  }
}
