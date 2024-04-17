# Discord Activity: Getting Started Guide

This template is used in the [Building An Activity](https://discord.com/developers/docs/activities/building-an-activity) tutorial in the Discord Developer Docs.

Read more about building Discord Activities with the Embedded App SDK at [https://discord.com/developers/docs/activities/overview](https://discord.com/developers/docs/activities/overview).

Steps to launch activity
1: Be in a discord channel with <25 members
2: Invite your testers to the application using the discord developer tools
3: Launch backend, then cloudflare, then frontend, using the following commands

- backend: `npm run dev`
- cloudflare tunnel `cloudflared tunnel --url http://localhost:5173`
- frontend: `npm run dev`
4: When players join, their addition is logged into the center of the screen. When participants speak, their global name is displayed to be speaking in a \<p> tag with the text `${speaker.global_name} is speaking` and when they stop, their corresponding tag is removed.
