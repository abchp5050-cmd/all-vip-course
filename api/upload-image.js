const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }
  
  if (!IMGBB_API_KEY) {
    console.error("IMGBB_API_KEY is missing!");
    return res.status(500).json({ success: false, error: "Server configuration error: Image service key missing." });
  }
  
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ success: false, error: "Missing 'image' base64 string in request body." });
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('image', image);
    
    const imgbbResponse = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const imgbbData = await imgbbResponse.json();
    
    if (!imgbbResponse.ok || !imgbbData.success) {
      console.error("ImgBB API Error:", imgbbData);
      return res.status(imgbbResponse.status).json({
        success: false,
        error: imgbbData.error?.message || imgbbData.error || "ImgBB upload failed due to API error."
      });
    }
    
    return res.status(200).json({
      success: true,
      url: imgbbData.data.url,
      display_url: imgbbData.data.display_url
    });
    
  } catch (error) {
    console.error("Server Error during ImgBB upload:", error);
    return res.status(500).json({ success: false, error: `Internal Server Error: ${error.message}` });
  }
}
