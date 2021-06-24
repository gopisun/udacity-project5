const truffleConfig = require("../truffle-config");

const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, "DUM", {from: accounts[0]})
    let starName = await instance.lookUptokenIdToStarInfo.call(tokenId)
    console.log('Star name: ' + starName)
    assert.equal(starName, 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, 'DUM2', {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, 'dum3', {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId,'dum4', {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId,'dum5', {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
        let tokenId = 71;
        let starSymbol ="LTS"
        let instance = await StarNotary.deployed();
        //console.log(instance);
         await instance.createStar('Little star!', tokenId, starSymbol, {from: accounts[0]});
        // console.log(instance.tokenIdToStarInfo);
       // await instance.createStar('Little Star!', tokenId, starSymbol).send({from: accounts[0]});
       assert.equal(await instance.lookUptokenIdToStarInfo.call(tokenId), 'Little star!');
       assert.equal(await instance.lookUptokenIdToStarSymbol.call(tokenId), starSymbol);
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed

    let instance = await StarNotary.deployed();
    let owner1 = accounts[1];
    let owner2 = accounts[2];
    let tokenId1 = 701;
    let tokenId2 = 702;
    let starSymbol1 = 'SYM1'
    let starSymbol2 = 'SYM2'

    await instance.createStar('Onwer1 star before exchange', tokenId1, starSymbol1, {from: owner1});
    await instance.createStar('Onwer2 star before exchange', tokenId2, starSymbol2, {from: owner2});
    await instance.exchangeStars(tokenId1, tokenId2, {from: owner1});  // owner1 initiates the exchange
    assert.equal(await instance.ownerOf.call(tokenId1), owner2)
    assert.equal(await instance.ownerOf.call(tokenId2), owner1)

    await instance.exchangeStars(tokenId2, tokenId1, {from: owner2}); // owner2 initiates the exchange
    assert.equal(await instance.ownerOf.call(tokenId1), owner1)
    assert.equal(await instance.ownerOf.call(tokenId2), owner2)
});


it('Invalid stars exchange', async() => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed

    let instance = await StarNotary.deployed();
    let owner1 = accounts[1];
    let owner2 = accounts[2];
    let notOwner = accounts[3]
    let tokenId1 = 703;
    let tokenId2 = 704;
    let starSymbol1 = 'SYM3'
    let starSymbol2 = 'SYM4'

    await instance.createStar('Onwer1 star before exchange', tokenId1, starSymbol1, {from: owner1});
    await instance.createStar('Onwer2 star before exchange', tokenId2, starSymbol2, {from: owner2});
    // assert.throws( async () => {await instance.exchangeStars(tokenId1, tokenId2, {from: notOwner})}, "Transaction should be initiated by owner of tokenId1 or tokenId2")

    let checkResp
    try {
         checkResp = await instance.exchangeStars(tokenId1, tokenId2, {from: notOwner})
         console.log("Response is: ")
         console.log(checkResp)
         assert.fail(`Exchange was executed when expected to fail. Exception should have been thrown.`)
    } catch ( err) {
        console.log("Error is: " + err.message)
        console.log("Error name: " + err.name)
        console.log("Error number: " + err.number)
        const splitErrMsg = err.message.split(":")
        const errMsgFromContract = splitErrMsg[splitErrMsg.length-1]
        console.log("Error msg from contract: " + errMsgFromContract)
        const expectedErr = "Transaction should be initiated by owner of tokenId1 or tokenId2."
        assert.equal( errMsgFromContract.trim(), expectedErr)

    }
    

              //      'Transaction should be initiated by owner of tokenId1 or tokenId');  // non owner initiates. Should fail
   // assert.equal(await instance.ownerOf.call(tokenId1), owner2)
   // assert.equal(await instance.ownerOf.call(tokenId2), owner1)
   
});


it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.

    let instance = await StarNotary.deployed();
    let owner1 = accounts[4];
    let newOwner = accounts[5];
    
    let tokenId1 = 714;
    let starSymbol1 = 'SYM14'

    await instance.createStar('Star for transfer', tokenId1, starSymbol1, {from: owner1});
    await instance.transferStar(newOwner,tokenId1, {from: owner1})
    assert.equal(await instance.ownerOf.call(tokenId1), newOwner)
   
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    // 2. Call your method lookUptokenIdToStarInfo
    // 3. Verify if you Star name is the same

    let instance = await StarNotary.deployed();
    let owner = accounts[0];
    let tokenId1 = 720;
    let starSymbol1 = 'SYM20'
    let starName = 'Star just for Lookup'

    await instance.createStar(starName, tokenId1, starSymbol1, {from: owner})
    assert.equal(await instance.lookUptokenIdToStarInfo.call(tokenId1), starName)

});