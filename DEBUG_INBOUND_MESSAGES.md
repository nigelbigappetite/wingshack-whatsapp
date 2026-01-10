# Debugging Inbound Messages Not Appearing

## Quick Checklist

### 1. Railway Worker Authentication ✅/❌
**Check Railway logs for:**
- ✅ `[WPPCONNECT] WhatsApp client started successfully` = Authenticated
- ❌ `Waiting for QRCode Scan` or repeated QR codes = NOT authenticated

**If not authenticated:**
- Access Railway worker's public URL
- Scan QR code with WhatsApp
- Wait for "client started successfully" message

### 2. Railway Receiving Messages ✅/❌
**After sending a WhatsApp message, check Railway logs for:**
- ✅ `[INBOUND] Raw message received:` = Message received
- ✅ `[INBOUND] Received message from +44...` = Processing message
- ❌ No `[INBOUND]` logs = Worker not receiving messages (not authenticated)

### 3. Railway Forwarding to Webhook ✅/❌
**Check Railway logs for:**
- ✅ `[INBOUND] Successfully forwarded message from +44...` = Webhook called successfully
- ❌ `[INBOUND] Error forwarding message` = Webhook call failed
- ❌ `[INBOUND] Webhook response status: 401` = Authentication issue
- ❌ `[INBOUND] Webhook response status: 400` = Bad request data

### 4. Vercel Webhook Receiving ✅/❌
**Check Vercel logs (if available) or test webhook:**
- Webhook endpoint: `https://wingshack-whatsapp.vercel.app/api/webhooks/whatsapp/inbound`
- Should return `200 OK` with `{ ok: true, thread_id: "...", message_id: "..." }`

### 5. Database Check ✅/❌
**Check Supabase:**
- Go to Supabase Dashboard → Table Editor
- Check `messages` table for new rows with `direction = 'in'`
- Check `threads` table for updated `last_message_at`

## Common Issues

### Issue 1: Railway Not Authenticated
**Symptom:** Railway logs show repeated QR codes
**Solution:** 
1. Configure Railway volume for `/app/wpp-session`
2. Access Railway worker URL
3. Scan QR code
4. Verify authentication in logs

### Issue 2: Webhook Authentication Mismatch
**Symptom:** Railway logs show `401 Unauthorized` when forwarding
**Solution:**
- Verify `WHATSAPP_WEBHOOK_SECRET` in Railway matches Vercel
- Check for typos or extra spaces

### Issue 3: Wrong Webhook URL
**Symptom:** Railway logs show connection errors
**Solution:**
- Verify `DASHBOARD_WEBHOOK_URL` in Railway is: `https://wingshack-whatsapp.vercel.app/api/webhooks/whatsapp/inbound`
- No trailing slash

### Issue 4: Message Type Filtered Out
**Symptom:** Railway receives message but doesn't forward
**Solution:**
- Check Railway logs for `[INBOUND] Skipping message`
- Worker only processes `type: 'chat'` messages with `body` text
- Group messages (`@g.us`) are ignored

## Testing Steps

1. **Send a test WhatsApp message** to your connected number
2. **Check Railway logs immediately** - look for `[INBOUND]` entries
3. **If no logs:** Worker not authenticated or not receiving
4. **If logs show error:** Check the specific error message
5. **If logs show success:** Check Vercel webhook and database

## Railway Logs to Look For

```
[INBOUND] Raw message received: { from: '...', type: 'chat', ... }
[INBOUND] Received message from +44...: Hello...
[INBOUND] Successfully forwarded message from +44...
```

OR

```
[INBOUND] Error forwarding message from +44...: <error message>
[INBOUND] Webhook response status: 401
```

