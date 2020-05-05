const config = require('config');
const mysql      = require('mysql');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
var natural = require('natural');
var apparatus = require('apparatus');
const dd = function(x)
	{
		console.log("************");
		console.log("*****spider*******");
		console.log("************");
		console.log("************");
		console.log(x)
		console.log("************");
		console.log("*****spider*******");
		console.log("************");
		process.exit();
	}

const alphaParser = require('../app/classifiers/AlphaDTClassify.js');
// var bayes = require('bayes') 



alphaParser.create()
	.then(AP => classifyThings(AP));
// AlphaParser.sanityCheck();

function classifyThings(aParse){
	getSampleItems(4000)
		// .then(items => aParse.batchClassify(items))
		// .then(items => classifyBrands(items))
		// .then(items => classifyItemBrands(items))
		.then(items => classifyBrandsNLBayes(items))
		.then(brandClassifier => {
			brandClassifier.classifier.smoothing = 0.1;
			this.classifierOfBrand = brandClassifier;

			console.log("Learning completed, testing new set")
			getSampleItems(1000, 4000)
				.then(testItems => testClassifier(testItems, this.classifierOfBrand, true))
			// console.log(this.testItemSet[3]);
			// dd(brandClassifier);
			// brandClassifier.classify(this.testItemSet[3].name);
		})
		// .then(brandState => {
		// 	dd(JSON.parse(brandState));
		// })
		.catch(error => console.log(`classify error: ${error}`));
}

// function classifyBrands(items)
// {
// 	// dd(items);
// 	return new Promise(function(resolve,reject) {
// 	var classifierBrand = bayes();
// 	items.forEach(function(item){
// 		classifierBrand.learn(item.name, item.brand)
// 	})

// 	var testItem = items[0];

// 	// classifierBrand.categorize(testItem.name).then(result => dd(result));

// 	// Promise.all(classifierBrand).then(brands => dd(brands.toJson()));
// 	Promise.all(classifierBrand).then(brands => resolve(classifierBrand.toJson()) );

// 	// dd();
// 	resolve(  );
// 	// resolve(classifierBrand.toJson());
// 	});
// }

async function classifyBrandsNLBayes(items)
{
	var classifier = new natural.BayesClassifier();
	classifier.classifier.smoothing = 0; //0.1;


	// var classifier = new apparatus.BayesClassifier();

	 // classifier.events.on('trainedWithDocument', function (obj) {
       // console.log(obj);
       /* {
       *   total: 23 // There are 23 total documents being trained against
       *   index: 12 // The index/number of the document that's just been trained against
       *   doc: {...} // The document that has just been indexed
       *  }
       */
    // });

	var phrases = [];
	
	for(var i = 0; i<items.length; i++) {
		var item = items[i];
		// dd(brandTokenizer(item.name))
		classifier.addDocument(brandTokenizer(item.name), item.brand);
		phrases.push(formatNameForBrand(item.name));
	}
 
	await classifier.train();
	await testClassifier(this.testItemSet, classifier, true)
	return classifier;
	// console.log(classifier.classify('Leica V-LUX 20 Digital Camera '));
	// console.log(classifier.getClassifications('Leica V-LUX 20 Digital Camera '));

}

// async function classifyItemBrands(items)
// {
// 	var classifierBrand = bayes();
// 	var self = this;
// 	var processQueue = [];
// 	var phrases = [];
	
// 	//won't work w/ await
// 	// items.forEach(function(item){
// 	// 	var brandPart = item.name.replace(/[.-\/-]+/gi,'').trim();
// 	// 	processQueue.push(classifierBrand.learn(brandPart, item.brand));
// 	// 	phrases.push(brandPart);
// 	// })
// 	// await Promise.all(processQueue).then(return(classifierBrand));

// 	for(var i = 0; i<items.length; i++) {
// 		var item = items[i];
// 		var brandPart = formatNameForBrand(item.name);
// 		await classifierBrand.learn(brandPart, item.brand);
// 		phrases.push(brandPart);
// 	}
// 	// dd([phrases,classifierBrand]);

// 	// dd(this.testItemSet);
// 	// testGenericClassifyItem(this.testItemSet[10].name, classifierBrand, this.testItemSet[10].brand);
// 	await testClassifier(this.testItemSet, classifierBrand)
// 	return classifierBrand;
// }

async function testClassifier(items, classifier, debug = false)
{
	var failedItems = [];
	for(var i = 0; i<items.length; i++) {
		var result = await testGenericClassifyItem(brandTokenizer(this.testItemSet[i].name), classifier, this.testItemSet[i].brand, debug);
		if(result !== true){
			if(debug) {
				getDetailedClassification(brandTokenizer(this.testItemSet[i].name), classifier);
			}
			failedItems.push(
				this.testItemSet[i].tumblr_id+": "+result
			);
		}
	}

	console.log("Total items: "+items.length+", failed items: "+failedItems.length);
	if(failedItems.length){
		dd(failedItems);
		return false;
	} else {
		return true;
	}

}
function getDetailedClassification(tokenArray, classifier)
{
	var c = classifier.classifier;
	var oneHotTokenArray = classifier.textToFeatures(tokenArray);	
	var labels = c.getClassifications(oneHotTokenArray);
	var tokenMap = [];
	for(var key in classifier.features) {
		tokenMap.push(key);
	}


	// dd(oneHotTokenArray);
	// labels.forEach(function(label){
	for(var x = 0; x<labels.length; x++){
		var label = labels[x];
		var i = oneHotTokenArray.length;
		var brandName = label.label;
		label.tokens = {};
		label.logValue = Math.log(label.value);
		// dd(c.classFeatures);	
		// dd(label);
		// dd(oneHotTokenArray);
        while(i--) {
            if(oneHotTokenArray[i]) {
            	/** * notes 
            	
            	c.classTotals = number of time each class (brand) is in the learning documents
            	c.classFeatures = array of token keys and how many times they occur in a class (brand)
            	
            	**/
            	// dd(c.getClassifications(tokenArray));

            	// dd(c.getClassifications(classifier.textToFeatures(tokenArray)));
            	
            	// dd([brandName,c.classFeatures[brandName][i],i]);
            	// dd([c.classFeatures,brandName, tokenArray[i]])

            	// var count = this.classFeatures[label][i] || this.smoothing;
             //    prob += Math.log(count / this.classTotals[label]);
             	
                var count = c.classFeatures[brandName][i] || c.smoothing;
                // numbers are tiny, add logs rather than take product
                // prob += Math.log(count / c.classTotals[brandName]);
                label.tokens[tokenMap[i]+" ("+i+")"] = count +" / "+c.classTotals[brandName] + " = "+ Math.log(count / c.classTotals[brandName]);
                
              //   label.allTokens = {};
              //   for( var key in c.classFeatures[brandName]) {
            		// label.allTokens[tokenMap[key]+" ("+key+")"] = c.classFeatures[brandName][key];
              //   }
            }
        }
        // dd([label,c.classFeatures[brandName]]);
        // dd(label);
	}

	// dd(labels);
	labels.unshift(classifier.classify(tokenArray));
	labels.unshift(tokenArray.join(" "));

	dd(labels);

	return labels;
}

async function testGenericClassifyItem(testText, classifier, expectedResult, debug = false)
{
	// var result = await classifier.categorize(testText)
	var result = await classifier.classify(testText)
	if( expectedResult.toLowerCase().trim() == result.toLowerCase().trim() ){
		return true;
	} else {
		// console.log(testText);
		// console.log([expectedResult, result]);
		// await classifier.categorize(testText, true); // run debug
		// await classifier.getClassifications(testText, true); // run debug
		return testText.join(" ") + "("+expectedResult +") => "+result;
	}
}

function formatNameForBrand(name)
{
	// remove useless words


	return name.toLowerCase()
		.split(' for ').shift() // remove what brand a 3rd party item applies to
		.split('\n').shift()	// remove multi-line
		.replace(/[.-\/-]+/gi,'')	// collapse stuff like f/1.4 and 70-200
		.replace('  ',' ')	// remove any double spaces
		.trim();
	// return name.replace(/[.-\/-]+/gi,'').trim();
}

function brandTokenizer(name)
{
	var badWords = "camera without orders waitlist over priority have will deposits preorders"
	var tokens = formatNameForBrand(name).split(" ");
	return removeBadWords(tokens, badWords);
}

function removeBadWords(tokens, badWords=[])
{
	var tokensAreArray = Array.isArray(tokens);
	if(!tokensAreArray) tokens = tokens.split(" ");
	if(!Array.isArray(badWords)) badWords = badWords.split(" ");
	var washedTokenArray =  tokens.filter( ( token ) => !badWords.includes( token ) )
	if(tokensAreArray) {
		return washedTokenArray;
	} else {
		return washedTokenArray.join(" ");
	}
}


/////// 

function getSampleItems(num=10, offset=0) {
	return new Promise(function(resolve,reject) {
		var self = this;
		connection.query(`
		SELECT t.id as tumblr_id, t.product_name, b.name as brand
		FROM tumblr_posts t, alpha_brands b
		WHERE t.alpha_brand_id = b.id
		AND t.alpha_brand_id IS NOT NULL
		LIMIT ? OFFSET ?
		`, [num, offset] ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				var titles = [];
				results.forEach(function(row){
					titles.push({"tumblr_id":row.tumblr_id, "name":row.product_name,"brand":row.brand});
				});
				self.testItemSet = titles;
				resolve(titles);
			}
		});	
	});
}



