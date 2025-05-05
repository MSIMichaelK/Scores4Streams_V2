export const uploadGameLogo = onRequest(async (req, res) => {
    // Allow CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
  
    try {
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
      }
  
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
  
      const { base64Logo, gameId, teamType } = req.body;
      if (!base64Logo || !gameId || !teamType) {
        res.status(400).json({ error: 'Missing fields' });
        return;
      }
  
      const buffer = Buffer.from(base64Logo, 'base64');
      const filename = `${teamType}.png`;
      const filePath = `logos/${gameId}/${filename}`;
      const file = bucket.file(filePath);
  
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        resumable: false,
      });
  
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2030',
      });
  
      res.status(200).json({ url });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });