---
title = "Hello People This Is My Blog"
description = "Short summary of the page"
date = "2025-11-24"
draft = false
tags = ["gleam", "programming", "webdev"]
---

# Hello people!

I guess the time has come for me to start blogging, or at least try to. So in the past few weeks, I started considering and searching for my options. I wanted a very minimal blog and, of course, for it to be static.

There are hundreds of static site generators out there, from popular solutions to unknown projects hidden in various git hosting platforms. I experimented a little with a few of them, but then I thought: why not build my own? Probably a lot of people thought the same—that's why there are so many solutions. So I decided to write one in the beloved Gleam!

After a couple of weeks, **Tale** was born, and this blog was created with it.

You can check it here: [Tale](https://github.com/Willyboar/tale)

## What about Tale?

I wanted a static site generator with a CLI that creates a site as fast as possible. With one command:

```bash
tale new site name
```

And voilà! Site created, with the default theme in the themes directory and a placeholder post. You just need to configure some details in the `config.toml` file, and you are ready to serve your site/blog with a simple command:

```bash
tale serve
```

Visit [localhost](https://localhost:8000) and you can see your blog/site.

Or you can point it to serve on a specific port:

```bash
tale serve 8005
```

> The server is pretty basic but has a simple watch feature that rebuilds the site when it detects a change. It still requires reloading the browser, though.

Another feature I wanted was to easily change and create themes. Tale has a special command:

```bash
tale new theme my_theme
```

A brand new theme based on the default is created. You can configure the theme.toml file as you want, change CSS, load CSS frameworks, add JS libraries like highlight.js, change templates, etc. You can also publish your themes on a git host and let others use it! It's simple: copy the theme inside your `themes/ directory` of your site and edit the config.toml to point to your theme. The sky is your limit.

## How can I put my site online?

There are a lot of options to deploy your site online. Some famous ones are GitHub Pages and Netlify, and you can do it for free on both of them.

Personally i used netlify to host this site. I didn't mess with automatic builds. I just pointed a github repo containing my site, configure to deploy the public folder and i was ready.

## What's next?

There are a few projects I have in my mind. I wanted that blog to mostly write about projects I will create in the future.

The next project I will work on is an **error tracker** in Gleam!

I hope I will start this project soon. Goodbye until next time!
