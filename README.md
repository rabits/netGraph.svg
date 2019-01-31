netGraph.svg
============

[![CircleCI](https://img.shields.io/circleci/project/github/rabits/netGraph.svg/master.svg)](https://circleci.com/gh/rabits/netGraph.svg)

SVG-application to visualize network topology & automate your network changes

Available actions:
* Create/destroy items
* Connect/disconnect items
* Save result as an svg file with edit logic

## Requirements

* Latest Firefox/Chromium browser

## Getting Started

Check how the project is working right here:
* Latest good bundle build [netGraph.svg](https://circleci.com/api/v1.1/project/github/rabits/netGraph.svg/latest/artifacts/0/home/circleci/netGraph.svg/out/netGraph.svg?branch=master&filter=successful)
* Current master multifile [main.svg](https://rabits.github.io/netGraph.svg/main.svg)

The netGraph.svg could work as is - just open the main.svg from the repository in your browser.

When you opened the SVG file in the first time, you will see nothing, but empty space. Click
secondary mouse button on the empty space and you will see the menu items available.

When you created the graph, relations & connections - you can save it. Right click on the empty
space and select Save SVG. It will save results of your work.

### Controls

* Right Mouse Button - context menu with actions
* Left Mouse Button - select / move
  * + Ctrl - create link
* Delete/Backspace - remove item / link

## Build

You can compile the source files into one svg file. Sources will be minified and the file will be
really handy to use.

## Dependencies

* [d3js](https://d3js.org/) - The svg manipulation framework

## Authors

* **Ross Kirsling** - *Initial work* - [Modal Logic Playground](https://github.com/rkirsling/modallogic)
* **Rabit**

## TODO

* Save result as r/o svg file

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Support

If you like this project, you can support our open-source development by a small Bitcoin donation.

Bitcoin wallet: `3Hs7bXdEQ8Uja7RvsA29woA4Bh5d2Tx2sf`
