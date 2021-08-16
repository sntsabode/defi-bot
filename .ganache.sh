#!/bin/bash

for (( ; ; ))
do
  echo "Booting Ganache"
  echo

  eth_node_url=$(<.eth_node_url)
  dai_user_address=$(<.daiuseraddress)

  echo "ETH NODE URL found:"
  echo "$eth_node_url"
  echo

  echo "DAI USER ADDRESS found:"
  echo "$dai_user_address"
  echo

  yarn run ganache-cli --fork "$eth_node_url" --port 7545 --unlock 0x6b175474e89094c44da98b954eedeac495271d0f --unlock "$dai_user_address"
done
