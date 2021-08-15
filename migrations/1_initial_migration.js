// eslint-disable-next-line
const Migrations = artifacts.require('Migrations')

// eslint-disable-next-line
module.exports = deployer => {
  deployer.deploy(Migrations)
}