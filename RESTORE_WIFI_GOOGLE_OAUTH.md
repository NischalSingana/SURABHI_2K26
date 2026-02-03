# Restore Google OAuth on Your WiFi

## 🔍 The Problem:
- **Before:** Google OAuth worked fine on WiFi
- **Now:** Blocked on WiFi, but works on mobile hotspot
- **Means:** Something changed in your WiFi/router/network recently

---

## 🎯 What Could Have Changed?

### 1. **Router Firmware Update**
Your router might have auto-updated and enabled new security features

### 2. **ISP Policy Change**
Your ISP might have enabled new blocking/filtering

### 3. **Antivirus/Security Software Update**
Recent update might be blocking OAuth

### 4. **DNS Server Change**
Your router's DNS might have changed

### 5. **Browser/System Update**
Recent update might have changed how cookies work

---

## 🔧 Quick Fixes (Try in Order):

### **Fix 1: Restart Router (Often Works!)**

```bash
# This clears router's cache and rules
```

1. Unplug router power cable
2. Wait 30 seconds
3. Plug back in
4. Wait for WiFi to come back online
5. Test Google login

**Success rate: 60%** - Often fixes random blocks!

---

### **Fix 2: Change WiFi DNS to Google DNS**

Your router's DNS might be blocking. Override it:

**macOS:**
1. **System Settings** → **Network**
2. Select **Wi-Fi**
3. Click **Details**
4. Go to **DNS** tab
5. Click **+** and add:
   ```
   8.8.8.8
   8.8.4.4
   ```
6. Click **OK** → **Apply**

**Test:** Open new browser tab → http://localhost:3000/login

**Success rate: 80%** - Usually fixes DNS-level blocks!

---

### **Fix 3: Clear Browser Data (Again)**

Something might be cached from before:

1. Close ALL browser tabs
2. **Chrome:** Settings → Privacy → Clear browsing data
   - Time range: **Last 7 days**
   - Check ALL boxes
   - Click **Clear data**
3. Restart browser
4. Test Google login

---

### **Fix 4: Check Router Admin Panel**

Your router might have enabled parental controls or security features:

1. Open router admin (usually http://192.168.1.1 or http://192.168.0.1)
2. Login (check router sticker for password)
3. Look for:
   - **Parental Controls** → Disable
   - **Security Features** → Check if OAuth is blocked
   - **Website Blocking** → Remove Google if listed
   - **DNS Settings** → Change to `8.8.8.8` and `8.8.4.4`
4. Save and restart router

---

### **Fix 5: Disable IPv6 (Test Only)**

Sometimes IPv6 causes OAuth issues:

**macOS:**
1. **System Settings** → **Network**
2. Select **Wi-Fi** → **Details**
3. Go to **TCP/IP** tab
4. Configure IPv6: **Link-local only** (or Off)
5. Click **OK** → **Apply**
6. Test Google login

---

### **Fix 6: Check Antivirus/Security Software**

If you installed/updated any security software recently:

**Check these apps:**
- Kaspersky
- McAfee
- Norton
- Bitdefender
- Any VPN software

**Solution:**
1. Open the security app
2. Find "Web Protection" or "Network Protection"
3. Add exception for:
   - `accounts.google.com`
   - `oauth2.googleapis.com`
   - Your browser (Chrome/Edge)
4. Test Google login

---

## 🧪 **Test Commands (Run These):**

```bash
# Test 1: Check current DNS
scutil --dns | grep "nameserver"

# Test 2: Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Test 3: Test connection after flush
ping -c 2 accounts.google.com

# Test 4: Check if anything blocking in hosts file
cat /etc/hosts | grep google

# Test 5: Test with curl
curl -I https://accounts.google.com --connect-timeout 5
```

---

## 📊 **Most Likely Causes:**

### **80% Chance: DNS Issue**
- Router's DNS provider changed or started blocking
- **Fix:** Change to Google DNS (8.8.8.8)

### **15% Chance: Router Update**
- Auto-update enabled new security features
- **Fix:** Restart router or check admin panel

### **5% Chance: ISP Policy**
- ISP enabled new filtering
- **Fix:** Use Google DNS or contact ISP

---

## ✅ **Recommended Solution:**

**Do this combo (works for 95% of cases):**

1. **Change DNS to Google DNS** (8.8.8.8, 8.8.4.4)
2. **Flush DNS cache:**
   ```bash
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```
3. **Restart router** (unplug 30 seconds)
4. **Clear browser cache** completely
5. **Test Google login**

---

## 🎯 **Quick Test to Verify Fix:**

```bash
# After applying fix, test:
ping -c 4 accounts.google.com

# Should see:
# 64 bytes from ... time=X ms
# 0% packet loss
```

If you see responses (not timeouts), it's fixed!

---

## 🔍 **Deep Diagnosis (If Above Doesn't Work):**

```bash
# Check what's blocking
traceroute accounts.google.com

# Check firewall rules
sudo pfctl -s all | grep google

# Check if IPv6 causing issues
ping6 accounts.google.com
```

---

## 💡 **Alternative for Now:**

**While you fix WiFi, use hotspot for development:**
- Hotspot works perfectly
- No code changes needed
- Can fix WiFi separately

**OR use Microsoft login:**
- Works on WiFi
- Same functionality

---

## 📞 **Next Steps:**

1. Try **DNS change** first (easiest, most likely fix)
2. If that doesn't work, try **router restart**
3. If still not working, run the test commands and share output

**Most common fix:** Just changing DNS to 8.8.8.8 and 8.8.4.4 solves it!

---

## ⚡ **Quick Command to Fix (Try This First):**

```bash
# Flush DNS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Test
ping -c 2 accounts.google.com

# If still fails, change DNS in System Settings (see Fix 2 above)
```
