# 部署指南

這份指南將幫助你在伺服器上部署 Laravel 應用程序。

## 1. 安裝 Laravel

首先，確保你已經安裝了 Composer。你可以使用以下命令來安裝 Composer：

bash
安裝 Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

接下來，使用 Composer 安裝 Laravel：

bash
composer install

## 2. Apache2 的設定

確保你已經安裝了 Apache2。你可以使用以下命令來安裝 Apache2：


接下來，啟用 Apache 的 mod_rewrite 模組：

bash
sudo apt update
sudo apt install apache2

bash
sudo a2enmod rewrite

然後，編輯 Apache 的配置文件，通常位於 `/etc/apache2/sites-available/000-default.conf`，並添加以下內容：

<VirtualHost :80>
ServerName your-domain.com
DocumentRoot /path/to/your-project-name/public
<Directory /path/to/your-project-name/public>
AllowOverride All
Require all granted
</Directory>
ErrorLog ${APACHE_LOG_DIR}/error.log
CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>

確保將 `/path/to/your-project-name` 替換為你的 Laravel 項目的實際路徑。

最後，重啟 Apache 以應用更改：

bash
sudo systemctl restart apache2

## 3. `.env` 的設定

在你的 Laravel 項目根目錄中，複製 `.env.example` 文件並重命名為 `.env`：


bash
cp .env.example .env

這將根據你的遷移文件創建數據表。

然後，編輯 `.env` 文件以設置你的環境變量，例如數據庫連接、應用名稱等：


APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:your-app-key
APP_DEBUG=true
APP_URL=http://your-domain.com
LOG_CHANNEL=stack
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

## 4. 運行 Migration

在設置好 `.env` 文件後，你可以運行 Laravel 的數據庫遷移來創建所需的數據表：

生成應用密鑰：

bash
php artisan migrate
## 完成

現在，你的 Laravel 應用程序應該已經成功部署並運行在 Apache2 上。你可以通過訪問 `http://your-domain.com` 來查看你的應用程序。

如果你有任何問題或需要進一步的幫助，請隨時聯繫我們！