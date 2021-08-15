#!/bin/bash

for (( ; ; ))
do
  echo "Booting Ganache"
  echo

  eth_node_url=$(<.eth_node_url)

  echo "ETH_NODE_URL found:"
  echo "$eth_node_url"
  echo

  yarn run ganache-cli --fork "$eth_node_url" --port 7545
done
