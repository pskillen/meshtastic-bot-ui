Meshtastic Bot UI (React)
========================

## Look and feel
- [ ] Dark mode
- [ ] Add an auto generated avatar for node cards - https://ui.shadcn.com/docs/components/avatar

## Pages to add
* [x] Nodes list
* [x] Node details
* [ ] Message history
    * [ ] Channels 1-8
    * [ ] Direct messages (where available)
* [ ] Settings
* [ ] Login, request API token, store locally

## Dashboard
* [x] Online nodes
* [ ] Active nodes (sending messages today)
* [x] Graph of packets vs time (24h)
* [ ] Node map (links to larger map page)

## Other features
* [x] Quick search node
* [ ] Update node battery source, and auto refresh

## Node list
* [x] Sort by last heard, short name, long name, nodeid, distance
* [x] accordion for online / offline
* [ ] option to hide offline
* [x] Map of current locations for all nodes

## Node details page
* [ ] Map of position history
* [ ] Disable chart zooming, etc
- [ ] Cardify the Node Details page

## Settings to add
- [ ] Home node ID (global)
- [ ] Channel 1-8 names (global)


## Build
* [x] Docker image
* [x] We're going to need to bake the API URL in at build time, for preprod or prod
* [ ] Build and smoke test docker image on pull request (and for other repos)
