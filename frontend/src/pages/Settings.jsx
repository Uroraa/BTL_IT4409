import React, { useState, useEffect } from "react";
fetch('/api/thresholds')
.then(res => {
if (!res.ok) throw new Error('no config');
return res.json();
})
.then(data => setTh(data))
.catch(() => {});
}, []);


async function save() {
try{
const res = await fetch('/api/thresholds', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(th)
});
if (!res.ok) throw new Error('save failed');
setStatus('Saved');
}catch(e){
setStatus('Error');
}
setTimeout(()=>setStatus(''),2000);
}


return (
<div className="bg-white p-4 rounded shadow max-w-md mx-auto">
<h2 className="text-xl font-bold mb-4">Threshold Settings</h2>


<div className="mb-3">
<label className="block text-sm">Temperature Max (°C)</label>
<input
className="border p-2 w-full"
type="number"
value={th.temp}
onChange={(e) => setTh({ ...th, temp: Number(e.target.value) })}
/>
</div>


<div className="mb-3">
<label className="block text-sm">Humidity Max (%)</label>
<input
className="border p-2 w-full"
type="number"
value={th.humid}
onChange={(e) => setTh({ ...th, humid: Number(e.target.value) })}
/>
</div>


<div className="flex items-center gap-3">
<button
onClick={save}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Save
</button>
<div className="text-sm text-gray-600">{status}</div>
</div>
</div>
);
