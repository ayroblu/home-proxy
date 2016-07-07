Basic Proxy
===========

Just my personal http proxy server

Lets Encrypt
------------
Make a certificate for each subdomain that you have, makes a static server in the cert dir for renewals (cron)

### Installation
```
sudo yum install epel-release
sudo yum install certbot
```

### Creating certificate
```
certbot certonly
```
This creates 4 certificates at: `/etc/letsencrypt/live/${hostname}/{cert,chain,fullchain,privkey}.pem`

Also help from: [https://community.letsencrypt.org/t/node-js-configuration/5175]

### Certificate renewal
Dry run for testing, remove when you put in cron
```
certbot renew --dry-run
```
