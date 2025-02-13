# speierling-site

https://www.cyon.ch/support/a/website-mit-git-veroffentlichen-und-aktualisieren


```
webroot$ mkdir -p $HOME/git
webroot$ cd $HOME/git
webroot$ git clone --bare https://github.com/basilstotz/speierling-site.git

```


```
local$ mkdir $HOME/git/
local$ cd $HOME/git
local$ git clone --bare https://github.com/basilstotz/speierling-site.git
local$ cd speierling-site.git
local$ git remote add <name> ssh://<Benutzername>@<Servername>:/home/<Benutzername>/git/speierling-site.git
local$ git push -u <name> +main:refs/heads/main
```

```
webroot$ mkdir -p $HOME/public/public_html/path/to/site
webroot$ echo -e '#!/bin/bash \nGIT_WORK_TREE=$HOME/public_html/path/to/site git checkout -f' > ~/git/speierling-site.git /hooks/post-receive
webroot$ chmod +x ~/git/speierling-site.git/hooks/post-receive
```

