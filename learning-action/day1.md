1. 首先我用 npm create vite@latest . -- --template react-ts 命令创建了项目
这个命令的作用是调用 vite@latest 脚手架在当前目录中创建，其中 . 表示当前目录， -- 表示后面的参数是传给 vite@latest 的，--template react-ts 表示让 vite@latest 创建react + typescript的项目

2. 根据supabase网站的介绍创建了免费实例，并将密钥保存到了.env.example文件中

3. 创建了src/lib/supabase.ts文件，该文件中基于VITE框架的机制，会自动读取.env中的配置信息，由于安全原因只会读取VITE_开头的环境变量
读取后可以通过import.meta.env获取到实际的值
然后根据这些值尝试创建supabase client，如果创建成功则表示supabase链接成功
需要澄清的是，VITE不会自动读取 .env.exmaple中的内容，这个文件只是一个实例文件可以提交到git仓库。.env文件才是实际的值，需要添加到.gitignore中，避免被暴露

4. 为了验证src/lib/supabase.ts文件中是否正常创建了supabase client，在App.tsx中添加 import { supabase } from './lib/supabase' 并运行npm run dev 后查看http://localhost:5173/页面的控制台，看是否打印了 Supabase client created: xxx 。发现确实打印了

