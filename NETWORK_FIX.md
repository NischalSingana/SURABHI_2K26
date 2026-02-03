# Fix ERR_CONNECTION_TIMED_OUT - accounts.google.com

## 🔴 Problem: Cannot reach Google OAuth servers

Error: `ERR_CONNECTION_TIMED_OUT` when accessing `accounts.google.com`

This is a **network/firewall issue**, not a code issue.

---

## 🔧 Quick Fixes (Try in order):

### 1️⃣ **Check Internet Connection**

```bash
# Test if you can reach Google at all
ping google.com

# Test if you can reach accounts.google.com
ping accounts.google.com

# Test with curl
curl -I https://accounts.google.com
```

**Expected:** Should get responses, not timeout.

---

### 2️⃣ **Check if VPN/Proxy is Blocking Google**

**If you're using a VPN:**
- Disconnect VPN
- Try Google login again
- If it works, your VPN is blocking Google OAuth

**If you're on company/school network:**
- Try using mobile hotspot
- Your network might be blocking Google

---

### 3️⃣ **Flush DNS Cache**

**macOS:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Then restart browser and try again.**

---

### 4️⃣ **Change DNS to Google DNS**

Your DNS might be blocking/slow. Switch to Google's DNS:

**macOS:**
1. Go to **System Settings** → **Network**
2. Select your active connection (Wi-Fi/Ethernet)
3. Click **Details**
4. Go to **DNS** tab
5. Click **+** and add:
   ```
   8.8.8.8
   8.8.4.4
   ```
6. Click **OK** and **Apply**

**Then test:** `ping accounts.google.com`

---

### 5️⃣ **Disable Firewall Temporarily (Test Only)**

**macOS:**
1. Go to **System Settings** → **Network** → **Firewall**
2. Turn OFF temporarily
3. Try Google login
4. Turn back ON after testing

**If this fixes it:** Your firewall is blocking Google OAuth.

**Solution:** Add exception for Chrome/Edge in firewall settings.

---

### 6️⃣ **Check Antivirus/Security Software**

If you have antivirus (McAfee, Norton, Kaspersky, etc.):
- It might be blocking OAuth redirects
- Temporarily disable and test
- If it works, add exception for your browser

---

### 7️⃣ **Try Different Browser**

- Chrome not working? Try Firefox or Safari
- Sometimes browser extensions block OAuth
- Try incognito/private mode

---

### 8️⃣ **Check Hosts File**

Your hosts file might be blocking Google:

```bash
# Check hosts file
cat /etc/hosts | grep google

# Should be empty or just show localhost
# If you see accounts.google.com, that's the problem
```

**If blocked, edit hosts file:**
```bash
sudo nano /etc/hosts

# Remove any lines with accounts.google.com or google.com
# Save: Ctrl+O, Enter
# Exit: Ctrl+X
```

---

## 🧪 Test Connection to Google:

Run these commands and share output:

```bash
# Test 1: Can you reach Google at all?
ping -c 4 google.com

# Test 2: Can you reach accounts.google.com?
ping -c 4 accounts.google.com

# Test 3: Can you reach via HTTPS?
curl -I https://accounts.google.com

# Test 4: Check your DNS
nslookup accounts.google.com

# Test 5: Trace route to Google
traceroute accounts.google.com
```

---

## 🌐 **Workaround: Use Microsoft Login Instead**

Since Microsoft login is working for you, users can use that instead:

1. Go to http://localhost:3000/login
2. Click **"Continue with Microsoft"**
3. This should work fine!

**Note:** This is a temporary workaround while you fix network access to Google.

---

## 📱 **Mobile Hotspot Test (Recommended)**

**Best way to diagnose if it's your network:**

1. Turn on mobile hotspot on your phone
2. Connect laptop to mobile hotspot
3. Try Google login again

**If it works on mobile hotspot:**
- Your Wi-Fi network is blocking Google
- Contact network admin or ISP
- Or continue using mobile hotspot for development

**If it still doesn't work:**
- Might be regional/ISP blocking Google
- Use Microsoft login instead
- Or use VPN that allows Google

---

## 🔍 Common Causes:

1. **Corporate/School Network:** Blocks OAuth redirects
2. **Restrictive Firewall:** Blocks external auth
3. **VPN Issues:** Some VPNs block Google
4. **ISP Throttling:** ISP blocking/throttling Google
5. **DNS Issues:** Slow/blocking DNS provider
6. **Antivirus:** Blocking OAuth flows
7. **Regional Restrictions:** Some regions block Google services

---

## ✅ Quick Solution:

**If you need to develop NOW and can't fix network:**

Use **Microsoft OAuth** - it's working fine for you!

**Or test on production:**
- https://klusurabhi.in - Google OAuth works there
- Your production server has proper network access

---

## 📞 Next Steps:

1. Run the test commands above
2. Share the output
3. I can help diagnose further

**Most likely cause:** Your network (Wi-Fi/ISP) is blocking Google OAuth.

**Quick test:** Try mobile hotspot - if it works, it's definitely your network.
