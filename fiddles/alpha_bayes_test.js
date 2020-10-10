const config = require('config');
var LZUTF8 = require('lzutf8');
const mysql      = require('mysql');
const connection = mysql.createConnection(config.get('dbConfig'));
connection.connect();
var natural = require('natural');
// var apparatus = require('apparatus');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// 1	Lenses
// 2	Digital Cameras
// 3	Film Cameras


alphaParser.create()
	.then(AP => classifyThings(AP));


// classifyThings();



function classifyThings(aParse=null){
	this.aParse = aParse;
	// dd([`Canon EOS M100 Digital Camera + EF-M 15-45mm f/3.5-6.3 IS STM Lens Kit + BONUS !`,brandTokenizer(`Canon EOS M100 Digital Camera + EF-M 15-45mm f/3.5-6.3 IS STM Lens Kit + BONUS !`, false),brandTokenizer(`Canon EOS M100 Digital Camera + EF-M 15-45mm f/3.5-6.3 IS STM Lens Kit + BONUS !`)]);
	// getFeatureClassifier("type", true) //, 5, true)
	// 	.then(classifier=>workClassifier(classifier, "type", 1000, "t"))
	// 	.then(results=>{
	// 		dd(results)
	// 		process.exit()
	// 		resolve(classifier);
	// 	});
	// getFeatureClassifier("brand")
	// .then(classifier=>workClassifier(classifier, "brand", 1000, "t"))
	// 	.then(results=>{
	// 		dd(results)
	// 		process.exit()
	// 		resolve(classifier);
	// 	});

	getFeatureClassifierFromSet(6) // Products, Canon Digital Cameras 
	.then(classifier=>workClassifier(classifier, "product", 1000, "t"))
		.then(results=>{
			dd(results)
			process.exit()
			resolve(classifier);
		});


	// getBrandClassifier()
	// 	.then(brandClassifier =>{
	// 		this.classifierOfBrand = brandClassifier;
	// 		workClassifier(brandClassifier, "brand", 100000, "t")
	// 			.then(process.exit());
	// 	})
}

// function getBrandClassifier()
// {
// 	return new Promise(function(resolve,reject) {
// 		getDataSetFromTraining("brand")
// 			.then(brandDocuments => classifyNLBayes(brandDocuments))
// 			.then(classifier => {
// 				resolve(classifier);
// 			}, failReason => dd(failReason))
// 	})
// }


function getFeatureClassifier(feature, makeNGrams = false, storedClassifierID = 0, forceRebuild = false)
{
	return new Promise(function(resolve,reject) {
		if(storedClassifierID && !forceRebuild) {
			resolve(getStoredClassifier(storedClassifierID));
		} else {
			getDataSetFromTraining(feature)
			.then(documents => classifyNLBayes(documents, [], makeNGrams))
			.then(classifier => {
				getClassifierFunFacts(classifier);
				// if(storedClassifierID){
				// 	dd("nope");
				// 	LZUTF8.compressAsync(JSON.stringify(classifier), {outputEncoding: "StorageBinaryString"}, function(compressedClassifierText){
				// 		// dd(compressedClassifierText)
				// 		// storeClassifier(storedClassifierID, compressedClassifierText)
				// 	})
				// }
				//now use this classifer to work some things
				resolve(classifier)
			}, failReason => dd(failReason))
		}
	})
}

function getFeatureClassifierFromSet(trainingSetId, makeNGrams = false)
{
	return new Promise(function(resolve,reject) {
		getDataSet(trainingSetId)
		.then(documents => classifyNLBayes(documents, [], makeNGrams))
		.then(classifier => {
			getClassifierFunFacts(classifier);
			resolve(classifier)
		}, failReason => dd(failReason))
	})
}

function storeClassifier(storedClassifierID, classifierText)
{
	return new Promise(function(resolve,reject) {
		var query= `
		INSERT INTO training_sets
		(id, notes)
		VALUES
		(?,?)
		ON DUPLICATE KEY
		UPDATE notes = VALUES(notes)
		`;
		connection.query(query,[storedClassifierID, classifierText],function (error) {
			if (error) {
				throw error;
				reject(false);
			} else {
				console.log("Classifer stored as ID: "+storedClassifierID)
				resolve(true);
			}
		});	
	});
}

function getStoredClassifier(storedClassifierID)
{
	return new Promise(function(resolve,reject) {
		var query= `
		SELECT 
		notes
		FROM training_sets
		WHERE id = ?`;
		connection.query(query, storedClassifierID,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				var products = [];
				dd(results.pop().notes);
					
				resolve(false)
			}
		});	
	});



	console.log("Restoring classifier ID: "+storedClassifierID)

	// LZUTF8.decompressAsync(input, {inputEncoding: "StorageBinaryString", outputEncoding: "ByteArray"}, function (result, error) {
// var restoredClassifier = natural.BayesClassifier.restore(JSON.parse(raw));
}


function getClassifierFunFacts(classifier)
{
	var c = classifier.classifier;
	var keys = Object.keys(c.classFeatures);
	if(keys.length>0) {
		console.log(keys)
		keys.forEach(function(classificationLabel){
			console.log(classificationLabel+": "+Object.keys(c.classFeatures[classificationLabel]).length+" classification labels")
		})
	}
}


function workClassifier(classifier, attribute, numRows = 10000, classifyPrefix="")
{
	return new Promise(function(resolve,reject) {
		var prefixAttribute = classifyPrefix + (classifyPrefix ? "_" : "") + attribute;
		getUntrainedRows(prefixAttribute, numRows)
			.then(async function(docs){
				console.log("Working "+docs.length+" rows for attribute: "+attribute)
				results = {};
				for(var i=0; i<docs.length; i++ ){
					var doc = docs[i];
					if(i%10 == 0) console.log("Row "+i+" of "+docs.length);
					
					var classificationConfidence = await classifier.getClassifications(doc.text).shift();
					var classification = classificationConfidence.label; //await classifier.classify(doc.text);
					var confidence = Math.log(classificationConfidence.value);
					// await markClassification(doc.id, prefixAttribute, classification);
					await markClassification(doc.id, prefixAttribute, classification);
					await markClassification(doc.id, (prefixAttribute+"_confidence"), confidence);
					if(!results[classification]) results[classification] = {};
					results[classification][doc.id] = doc.text;
				}
				console.log("all docs for "+attribute+" finished!")
				resolve(results);
			}, failReason => reject(failReason));
		});
}

function markClassification(id, attribute, value)
{
	return new Promise(function(resolve,reject) {
		var query= `
		UPDATE spider_training_set_digicams
		SET classification = JSON_SET(COALESCE(classification,'{}'), "$.`+attribute+`" , ?)
		WHERE id = ?`;
		connection.query(query, [value, id], function (error, results, fields) {
			if (error) {
				throw error;
				reject(false);
			} else {
				resolve(true)
			}
		});	
	});
}

function getUntrainedRows(attribute, numRows=100)
{
	return new Promise(function(resolve,reject) {
		var self = this;
		var query= `
		SELECT 
		id, text
		FROM spider_training_set_digicams
		WHERE classification->>"$.`+attribute+`" IS NULL
		AND text IS NOT NULL
		AND text NOT LIKE "%powershot%" # TODO remove this
		AND classification->>"$.t_brand" = "Canon"
		ORDER BY(MD5(id))
		LIMIT ?`;
		connection.query(query, [numRows] ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				var products = [];
				results.forEach(function(row){
					products.push({
						id: row.id,
						text: row.text
    				});
				});
				resolve(products)
			}
		});	
	});
}



///// REDUCE THIS
function x(){
	getSampleItems(4000)
		.then(items => classifyBrandsNLBayes(items))
		.then(brandClassifier => {
			brandClassifier.classifier.smoothing = 0.1;
			this.classifierOfBrand = brandClassifier;

			console.log("Learning completed, testing new set")

			


			// getSampleItems(1000, 4000)
				// auto-test
				// .then(testItems => testClassifier(testItems, this.classifierOfBrand, false))


			// getTrainingProducts()
			// classify some brands!
			classifySpiderTraining(brandClassifier)
			.then(x => {
				process.exit();
				getDataSet(3) //work some things from the spider set
					.then(trainingProducts => {
						// write those things then contine on w/ normal stuff
						classifyNLBayes(trainingProducts)
						.then(categoryClassifier = {
							// make category classifier (cameras, lenses, etc)


							// make category_brand classifier (Canon lenses, etc)

							// validate if working
							// make per-brand one
							// compare the two
						})
					})

				getSampleCategoryItems(500)
				// TODO: make generic classifier take a set of good, formatted names : intended category
				.then(categoryItems => classifyGenericNLBayes(categoryItems)) //but make category items actually work

				getSampleCategoryItems(100, 4000, true)
				.then(testItems => { 
					this.supervisedLearningQueue = testItems;
					workSupervisedLearningQueue();
				})
			})
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

async function classifyGenericNLBayes(items)
{
	var classifier = new natural.BayesClassifier();
	classifier.classifier.smoothing = 0; //0.1;

	var phrases = [];
	
	for(var i = 0; i<items.length; i++) {
		var item = items[i];
		classifier.addDocument(brandTokenizer(item.name), item.brand);
		phrases.push(formatNameForBrand(item.name));
	}
 
	await classifier.train();
	await testClassifier(this.testItemSet, classifier, true)
	return classifier;
}


// ******
// should be in format of 
// [
// 	{ 
// 		text:"some text",
// 		classification: "some text"
// 	}
// ]
// ******
async function classifyNLBayes(documents, testItemSet=[], makeNGrams=false)
{
	var classifier = new natural.BayesClassifier();
	// var ngClassifier = new natural.BayesClassifier();
	classifier.classifier.smoothing = 0; //0.1;

	var ngSet = [];
	
	for(var i = 0; i<documents.length; i++) {
		var doc = documents[i];
		
		if(doc.test)
		{
			testItemSet.push(doc)
		} else {
			var tokenizedDocument = brandTokenizer(doc.text, makeNGrams)
			classifier.addDocument(tokenizedDocument, doc.classification);
		}
	}

	/**
	// reduce to best n-grams
	//not needed if we push them right into the doc


	// var ngCount = {};
	// for (var i = 0; i < ngSet.length; i++) {
	//   var num = ngSet[i];
	//   ngCount[num] = ngCount[num] ? ngCount[num] + 1 : 1;
	// }

	// var bestGrams = {};
	// var numGrams = 10; // how many grams do we want

	// for (let [key, frequency] of Object.entries(ngCount)) {
	//   if(frequency > 1) {
	//   		bestGrams[key] = frequency;
	//   }
	// }
	
	// var bestGramsKeys = (Object.keys(bestGrams).sort(function(a,b){return bestGrams[b]-bestGrams[a]})).slice(0,numGrams);
	// var contrivedDoc = []; //need this to keep counts all proper w/o gettign too hacky
	// var contrivedDocs = []; //need this to keep counts all proper w/o gettign too hacky
	// bestGramsKeys.forEach(function(key){
	// 	contrivedDoc = Array.from({length:bestGrams[key]}).map(x => key)
	// 	dd(contrivedDoc)
	// })

	******/

 	console.log(documents.length+" total documents, "+testItemSet.length+" for testing");
	await classifier.train();

	//now set smoothing to not fail on -infinity if no match for token
	classifier.classifier.smoothing = 0.1;


	if(testItemSet.length > 0)
	{
		await testGenericClassifer(testItemSet, classifier, true)
	}

	return classifier;
}

// *****
// expected format:
// [
// 	{
// 		text: "some tokenized_text",
// 		classification: "some expected string"
// 	}
// ]
// *****
async function testGenericClassifer(testdocuments, classifier, debug = false)
{
	var failedItems = [];
	for(var i = 0; i<testdocuments.length; i++) {
		var doc = testdocuments[i];
		var testText = brandTokenizer(doc.text);
		var expectedResult = (doc.classification+"").toLowerCase().trim();
		var result = await (classifier.classify(testText)+"").toLowerCase().trim()

		if(expectedResult != result ){
			failedItems.push( testText.join(" ") + "("+expectedResult +") => "+result );
			if(debug) {
				console.log([getDetailedClassification(testText, classifier, expectedResult),doc])
				// process.exit();
			}
		} 
	}

	console.log("Total items: "+testdocuments.length+", failed items: "+failedItems.length);
	if(failedItems.length>0){
		console.log(failedItems);
		process.exit();
		return false;
	} else {
		return true;
	}

}



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
		console.log(failedItems);
		return false;
	} else {
		return true;
	}

}

function getDetailedClassification(tokenArray, classifier, expectedResult = null)
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
		var classificationLabel = label.label;
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
            	
            	// dd([classificationLabel,c.classFeatures[classificationLabel][i],i]);
            	// dd([c.classFeatures,classificationLabel, tokenArray[i]])

            	// var count = this.classFeatures[label][i] || this.smoothing;
             //    prob += Math.log(count / this.classTotals[label]);
             	
                var count = c.classFeatures[classificationLabel][i] || c.smoothing;
                // numbers are tiny, add logs rather than take product
                // prob += Math.log(count / c.classTotals[classificationLabel]);
                label.tokens[tokenMap[i]+" ("+i+")"] = count +" / "+c.classTotals[classificationLabel] + " = "+ Math.log(count / c.classTotals[classificationLabel]);
                
              //   label.allTokens = {};
              //   for( var key in c.classFeatures[classificationLabel]) {
            		// label.allTokens[tokenMap[key]+" ("+key+")"] = c.classFeatures[classificationLabel][key];
              //   }
            }
        }
        // dd([label,c.classFeatures[classificationLabel]]);
        // dd(label);
	}

	// dd(labels);
	labels.unshift(tokenArray.join(" "));
	labels.unshift("Actual result: "+classifier.classify(tokenArray));
	labels.unshift("Expected result: "+expectedResult);
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
		// .replace(/[.-\/-]+/gi,'')	// collapse stuff like f/1.4 and 70-200
		.replace(/[.-\/-]+/gi,'_')	// collapse stuff like f/1.4 and 70-200 to underscore
		.replace(/[^\s\d\w]/gi,' ') //replace any but: whitespace, digit, letter or underscore
		.replace(/(\b_\B)|(\B_\b)/gi,' ')	// remove any dashes that pre or post fix a token like word_ or _word
		.replace(/ _ /gi,' ')	// remove any solitary dashes
		.replace(/\s{2,}/gi,' ')	// collapse any two or more whitespace characters
		.trim();
	// return name.replace(/[.-\/-]+/gi,'').trim();
}

function brandTokenizer(name, makeNGrams = true)
{

	// name = this.aParse.tokenizeSplit(name, false); //will mess up any numbers and f/2 stuff
	// for PCV tumblr
	// var badWords = "camera without orders waitlist over priority have will deposits preorders pre_orders camera_"
	// var cleanName = removeBadWords(name, badWords);
	// var tokenizedDocument = formatNameForBrand(cleanName).split(" ");

	var tokenizedDocument = formatNameForBrand(name).split(" ");
	// make bi and tri-grams
	if(makeNGrams) {
		var NGrams = natural.NGrams;
		NGrams.bigrams(tokenizedDocument).forEach(function(gram)
		{
			tokenizedDocument.push(gram.join("_"));
		});
		NGrams.trigrams(tokenizedDocument).forEach(function(gram)
		{
			tokenizedDocument.push(gram.join("_"));
		});
	}
	return tokenizedDocument;
	
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

function workSupervisedLearningQueue()
{
	// dd(this.supervisedLearningQueue);
	var item = this.supervisedLearningQueue.pop();
	// dd(item);
	rl.question('Classify ['+item.name.trim()+']: (1) Lenses (2) Digital Cameras (3) Film Cameras (x) skip? ', (answer) => {
						// TODO: Log the answer in a database
						switch(answer) {
							case "1":
							case "2":
							case "3":
								writeItemCategory(item.tumblr_id, answer);
								break;
							default: writeItemCategory(item.tumblr_id, 0);
						}
						// console.log(`Thank you for your valuable feedback: ${answer}: `+item.tumblr_id);
						if(this.supervisedLearningQueue.length)
						{
							workSupervisedLearningQueue();
						} else {
							process.exit();
						}
						// rl.close();
					});
}

function writeItemCategory(itemId, itemCategoryAlphaId)
{
	console.log("Writing "+itemId+", "+itemCategoryAlphaId);
		connection.query(`
		UPDATE tumblr_posts
		SET alpha_category_id = ?
		WHERE id = ?
		LIMIT 1
		`, [itemCategoryAlphaId, itemId] ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} 
		});	
}



// *****
// [
// 	{
// 		text: "some tokenized_text",
// 		id: int
// 	}
// ]
// *****
function classifySpiderTraining(classifier)
{
	return new Promise(function(resolve,reject) {
	getDataSet(4)
		.then(trainingSet => {
			var classifiedResults = [];
			trainingSet.forEach(async item => {
				item.classification = {}; //this will exist in the future
				item.classification.brand = classifier.classify(item.text);
				classifiedResults.push([
					item.id,  //id: 
					JSON.stringify(item.classification) // classification: 
					// , text: item.text
				]);
				if(classifiedResults.length>=100) { //break off big chuncks
					pushIntoSpiderTraining(classifiedResults);
					classifiedResults = [];
				}
			})
			if(classifiedResults.length>0) {
				pushIntoSpiderTraining(classifiedResults);
			}
		})
		// .then(resolve(true))
	});
	// var result = await classifier.classify(testText)

}


// *****
// [
// 	{
// 		id: int,
// 		classification: some JSON string
// 	}
// ]
// *****
function pushIntoSpiderTraining(set)
{
	dd(set);
	return new Promise(function(resolve,reject) {
		var self = this;
		var query= `
		INSERT INTO spider_training_set_digicams
		(id, classification)
		VALUES
		?
		ON DUPLICATE KEY
		UPDATE classification = VALUES(classification)
		`;
		connection.query(query,[set] ,function (error) {
			if (error) {
				throw error;
				reject(false);
			} else {
				console.log("Items updated in spider training: "+set.length)
				resolve(true);
			}
		});	
	});
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

function getSampleCategoryItems(num=10, offset=0, learning=false) {
	return new Promise(function(resolve,reject) {
		var self = this;
		var query= `
		SELECT t.id as tumblr_id, t.product_name, b.name as brand
		FROM tumblr_posts t, alpha_brands b
		WHERE t.alpha_brand_id = b.id
		AND t.alpha_brand_id IS NOT NULL `;
		
		if(learning) {
			query += ' and t.alpha_category_id IS NULL ';
		} else {
			query += ' and t.alpha_category_id IS NOT NULL ';
			query += ' and t.alpha_category_id > 0 ';
		}
		query +=` LIMIT ? OFFSET ? `;
		connection.query(query, [num, offset] ,function (error, results, fields) {
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

function getTrainingProducts(byBrand=false) {
	return new Promise(function(resolve,reject) {
		var self = this;
		var query= `
		SELECT
		id,
		brand,
		product_name,
		# concat(brand," ",product_name) AS product_name,
		alpha_category_id
		FROM training_products`;
		connection.query(query, null ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				if(byBrand) {
					var products = {};
					results.forEach(function(row){
						products[row.brand] = [];
					});
					results.forEach(function(row){
						products[row.brand].push({"brand":row.brand, "text":row.product_name,"classification":row.alpha_category_id});
					});
				} else {
					var products = [];
					results.forEach(function(row){
						products.push({"brand":row.brand, "text":row.product_name,"classification":row.alpha_category_id});
					});
				}
				resolve(products);
			}
		});	
	});
}

function getDataSet(setId=0)
{
	// 1 category
	// 2 digital camera models
	// 3 training products

	return new Promise(function(resolve,reject) {
		var self = this;
		var query= `
		SELECT
		raw_data
		FROM training_sets
		WHERE id = ?`;
		connection.query(query, setId ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				// dd(results[0].raw_data);
				resolve(JSON.parse(results[0].raw_data))
			}
		});	
	});
}

function getDataSetFromTraining(attribute)
{
	return new Promise(function(resolve,reject) {
		var self = this;
		var query= `
		SELECT 
		id, text,
		training->>"$.`+attribute+`" as classification,
		training->>"$.`+attribute+`_test" as test
		FROM spider_training_set_digicams
		WHERE training->>"$.`+attribute+`" IS NOT NULL
		AND manual_review IS NULL`;
		connection.query(query, [] ,function (error, results, fields) {
			if (error) {
				throw error;
				reject();
			} else {
				var products = [];
				results.forEach(function(row){
					products.push({
						id: row.id,
						text: row.text,
						classification: row.classification,
						test: row.test
    				});
				});
				resolve(products)
			}
		});	
	});
}

// function getSpiderTrainingSet() //shouldn't need - pull from JSON set
// {

// 	return new Promise(function(resolve,reject) {
// 		var self = this;
// 		var query= `
// 		SELECT
// 		*
// 		FROM spider_training_set_digicams
// 		#WHERE id = ?
// 		`;
// 		connection.query(query, setId ,function (error, results, fields) {
// 			if (error) {
// 				throw error;
// 				reject();
// 			} else {
// 				// dd(results[0].raw_data);
// 				resolve(JSON.parse(results[0].raw_data))
// 			}
// 		});	
// 	});
// }



//https://austin.craigslist.org/search/sso?excats=20-24-24-1-50-1-4-9-12-1-6-1-7-1-3-1-3-4-6-2-2-8-1-1-1-1-1-1-1-1-3-1-1-1&format=rss&postal=78734&query=telescope%7Corion%7Cmeade%7Ccelestron%7Cioptron&search_distance=200&sort=date

//[{"text": "NIKON N5005", "classification": 3}, {"text": "NIKON 70-210/4 AI-S SERIES E", "classification": 1}, {"text": "NIKON 24/2.8 NON-AI", "classification": 1}, {"text": "NIKON 35/2 AI-S", "classification": 1}, {"text": "NIKON 20/3.5 AI", "classification": 1}, {"text": "SIGMA 24-70/2.8 EX DG", "classification": 1}, {"text": "NIKON AF 50/1.8 D", "classification": 1}, {"text": "NIKON AF-S 18-70/3.5-4.5 DX", "classification": 1}, {"text": "NIKON AF-S 55-300/4.5-5.6 VR G DX", "classification": 1}, {"text": "NIKON 18-105/3.5-5.6 VR DX", "classification": 1}, {"text": "NIKON AF-S 18-105/3.5-5.6 VR DX", "classification": 1}, {"text": "FUJI X100 W/CASE", "classification": 2}, {"text": "FUJI X-T1 W/GRIP", "classification": 2}, {"text": "FUJI X-T2", "classification": 2}, {"text": "FUJI 56/1.2", "classification": 1}, {"text": "FUJI 23/1.4", "classification": 1}, {"text": "FUJI 18-135/3.5-5.6 R LM OIS WR", "classification": 1}, {"text": "FUJI 55-200/3.5-4.8 R LM O.I.S", "classification": 1}, {"text": "FUJI XF 18-55/2.8-4 R LM OIS", "classification": 1}, {"text": "OLYMPUS E-M10 II", "classification": 2}, {"text": "OLYMPUS OM 28/3.5", "classification": 1}, {"text": "OLYMPUS OM 50/3.5 MACRO", "classification": 1}, {"text": "PANASONIC GX8", "classification": 2}, {"text": "PANASONIC 20/1.7", "classification": 1}, {"text": "PANASONIC 42.5/1.7 POWER O.I.S", "classification": 1}, {"text": "SONY FE 16-35/4 OSS T", "classification": 1}, {"text": "SONY FE 90/2.8 MACRO G OSS", "classification": 1}, {"text": "LEICA 105/6.3 MOUNTAIN LTM", "classification": 1}, {"text": "LEICA M 35/3.5 SUMMARON", "classification": 1}, {"text": "Fujifilm XF 8-16mm f/2.8 R LM WR Lens", "classification": 1}, {"text": "Fujifilm XF 200mm f/2 OIS WR Lens", "classification": 1}, {"text": "CANON AE-1 W/ 50/1.4 S.S.C", "classification": 3}, {"text": "CANON G7 X II", "classification": 2}, {"text": "CANON 70D", "classification": 2}, {"text": "CANON EOS-1 D MARK IV", "classification": 2}, {"text": "CANON 17-85/4-5.6 IS USM", "classification": 1}, {"text": "CANON EF 70-200/4 IS L", "classification": 1}, {"text": "CANON EF 35/1.4 L", "classification": 1}, {"text": "CANON EF-S 18-135/3.5-5.6 IS STM", "classification": 1}, {"text": "CANON EF-S 18-200/3.5-5.6 IS", "classification": 1}, {"text": "NIKON D750 W/GRIP", "classification": 2}, {"text": "NIKON AF-S 18-140/3.5-5.6 VR G", "classification": 1}, {"text": "NIKON 43-86/3.5 AI", "classification": 1}, {"text": "SIGMA AF 24-70/2.8 DG", "classification": 1}, {"text": "NIKON AF-S 18-55/3.5-5.6 VR", "classification": 1}, {"text": "CANON 60D", "classification": 2}, {"text": "CANON 5D MK III W/GRIP", "classification": 2}, {"text": "CANON REBEL T4I", "classification": 2}, {"text": "CANON 6D", "classification": 2}, {"text": "CANON 5D MK III", "classification": 2}, {"text": "CANON EF 40/2.8 STM", "classification": 1}, {"text": "CANON EF 100/2.8 IS L", "classification": 1}, {"text": "FUJI X-T10", "classification": 2}, {"text": "FUJI X-T1 W/GRIP", "classification": 2}, {"text": "FUJI X-T20", "classification": 2}, {"text": "FUJI 18-55/2.8-4 XF", "classification": 1}, {"text": "FUJI XF 35/1.4", "classification": 1}, {"text": "FUJI 14/2.8 R XF", "classification": 1}, {"text": "FUJI 18-55/2.8-4 R LM OIS XF", "classification": 1}, {"text": "SONY E 55-210/4.5-6.3 OSS", "classification": 1}, {"text": "SONY E 16-50/3.5-5.6 OSS", "classification": 1}, {"text": "SIGMA 30/1.4 C DC", "classification": 1}, {"text": "PANASONIC 35-100/2.8", "classification": 1}, {"text": "PANASONIC 12-35/2.8", "classification": 1}, {"text": "PANASONIC 14-42/4.5-5.6 G VARIO MEGA O.I.S", "classification": 1}, {"text": "PANASONIC 12-32/3.5-5.6", "classification": 1}, {"text": "CANON SURE SHOT 85 ZOOM", "classification": 3}, {"text": "SIGMA 70-300/4-5.6 CANON", "classification": 1}, {"text": "CANON 50/1.8 FD", "classification": 1}, {"text": "CANON 50/1.8 FD", "classification": 1}, {"text": "NIKON FE2", "classification": 3}, {"text": "NIKON F3HP", "classification": 3}, {"text": "NIKON D7000", "classification": 2}, {"text": "NIKON D300", "classification": 2}, {"text": "NIKON D5300", "classification": 2}, {"text": "NIKON 300/4.5 NON -AI", "classification": 1}, {"text": "NIKON AF-S 70-300/4.5-5.6 G VR", "classification": 1}, {"text": "FUJI GF 32-64/4 R LM WR", "classification": 1}, {"text": "FUJI GF 110/2 LM WR", "classification": 1}, {"text": "SONY RX100 III", "classification": 2}, {"text": "SONY NEX-5R", "classification": 2}, {"text": "SONY 30/3.5 MACRO E-MOUNT", "classification": 1}, {"text": "SONY E 20/2.8", "classification": 1}, {"text": "PANASONIC DMC-LX100", "classification": 2}, {"text": "PANASONIC DMC-LX100", "classification": 2}, {"text": "MAMIYA 50/4 SEKOR SHIFT C", "classification": 1}, {"text": "CANON 60D", "classification": 2}, {"text": "CANON 5D MK II", "classification": 2}, {"text": "CANON EF 14/2.8 L II", "classification": 1}, {"text": "SIGMA 135/1.8 ART", "classification": 1}, {"text": "CANON EF 50/1.4", "classification": 1}, {"text": "NIKON D610", "classification": 2}, {"text": "NIKON AF 50/1.8 D", "classification": 1}, {"text": "NIKON AF-P 18-55/3.5-5.6 DX VR", "classification": 1}, {"text": "NIKON AF-S 28-300/3.5-5.6 G VR", "classification": 1}, {"text": "NIKON AF-S 70-300/4.5-5.6 VR G", "classification": 1}, {"text": "OLYMPUS E-M1 W/GRIP", "classification": 2}, {"text": "OLYMPUS 25/1.8", "classification": 1}, {"text": "OLYMPUS 45/1.8", "classification": 1}, {"text": "OLYMPUS 40-150/4-5.6", "classification": 1}, {"text": "SONY RX1R", "classification": 2}, {"text": "SIGMA 30/1.4 C DC DN", "classification": 1}, {"text": "CANON 70D", "classification": 2}, {"text": "CANON EF 75-300/4-5.6 III", "classification": 1}, {"text": "CANON EF-S 55-250/4-5.6 IS STM", "classification": 1}, {"text": "CANON EF 24-105/4 IS L", "classification": 1}, {"text": "NIKON AF-S 70-300/4.5-5.6 VR", "classification": 1}, {"text": "NIKON AF-S 18-200/3.5-5.6G VR DX", "classification": 1}, {"text": "NIKON AF 70-210/4-5.6 D", "classification": 1}, {"text": "NIKON AF-S 35/1.8 DX", "classification": 1}, {"text": "OLYMPUS E-M10 II W/14-42", "classification": 2}, {"text": "PANASONIC DMC-FZ1000", "classification": 2}, {"text": "SONY RX1R", "classification": 2}, {"text": "SONY A6300 W/SMALLRIG", "classification": 2}, {"text": "SONY A6000 W/SMALLRIG CAGE", "classification": 2}, {"text": "SONY E 18-200/3.5-6.3 OSS LE", "classification": 1}, {"text": "SONY E 50/1.8 OSS", "classification": 1}, {"text": "SIGMA 18-35/1.8 ART DC", "classification": 1}, {"text": "CANON EF 100/2.8 IS L", "classification": 1}, {"text": "CANON EF 100/2.8 L IS", "classification": 1}, {"text": "OLYMPUS OM 55/1.2", "classification": 1}, {"text": "CANON 5D MK III W/GRIP", "classification": 2}, {"text": "CANON EOS-1 DS MK III", "classification": 2}, {"text": "CANON REBEL T4I", "classification": 2}, {"text": "CANON EF 500/4.5 L ULTRASONIC", "classification": 1}, {"text": "SIGMA 50-500/4-6.3 HSM", "classification": 1}, {"text": "CANON EF 50/1.8 STM", "classification": 1}, {"text": "CANON EF 35/2", "classification": 1}, {"text": "CANON EF 50/1.4", "classification": 1}, {"text": "CANON EF 24-105/4 IS L", "classification": 1}, {"text": "CANON EF-S 18-135/3.5-5.6 IS", "classification": 1}, {"text": "CANON EF 50/1.4", "classification": 1}, {"text": "NIKON AF 70-210/4-5.6", "classification": 1}, {"text": "NIKON 18-55/3.5-5.6", "classification": 1}, {"text": "NIKON AF 50/1.8 D", "classification": 1}, {"text": "NIKON AF 50/1.8 D", "classification": 1}, {"text": "NIKON AF-S 50/1.8 G", "classification": 1}, {"text": "NIKON AF-S 50/1.8 G", "classification": 1}, {"text": "NIKON AF-S 55-300/4.5-5.6 VR DX", "classification": 1}, {"text": "SIGMA AF 24-70/2.8 ART NIKON DG OS HSM", "classification": 1}, {"text": "NIKON AF-S 16-35/4 G", "classification": 1}, {"text": "NIKON AF-S 18-55/3.5-5.6", "classification": 1}, {"text": "SONY E 35/1.8", "classification": 1}, {"text": "SONY E 10-18/4 OSS", "classification": 1}, {"text": "SONY FE 100-400/4.5-5.6 GM OSS", "classification": 1}, {"text": "OLYMPUS 40-150/4-5.6R", "classification": 1}, {"text": "OLYMPUS 17/1.8", "classification": 1}, {"text": "OLYMPUS 45/1.8", "classification": 1}, {"text": "OLYMPUS 12-40/2.8 PRO", "classification": 1}, {"text": "SIGMA 10-20/4-5.6 DC HSM", "classification": 1}, {"text": "CANON 7D MK II W/GRIP", "classification": 2}, {"text": "CANON 6D", "classification": 2}, {"text": "CANON T3I W/18-55 IS II", "classification": 2}, {"text": "CANON 7D", "classification": 2}, {"text": "CANON 5D MK III", "classification": 2}, {"text": "CANON EF 70-300/4.5-5.6 IS DO", "classification": 1}, {"text": "CANON EF 85/1.8", "classification": 1}, {"text": "CANON EF 20-35/3.5-5.6", "classification": 1}, {"text": "CANON EF 50/1.4 USM", "classification": 1}, {"text": "CANON EF 35/2 STM IS", "classification": 1}, {"text": "CANON EF 50/1.4", "classification": 1}, {"text": "CANON EF-S 10-18/4.5-5.6 IS STM", "classification": 1}, {"text": "CANON EF 75-300/4-5.6 III", "classification": 1}, {"text": "CANON EF 24-105/4 IS L", "classification": 1}, {"text": "CANON EF 85/1.8", "classification": 1}, {"text": "NIKON AF-S 18-140/3.5-5.6 G VR DX", "classification": 1}, {"text": "NIKON AF 85/1.4 D", "classification": 1}, {"text": "NIKON AF 80-200/2.8 PUSH-PULL D", "classification": 1}, {"text": "NIKON AF-P 10-20/4.5-5.6 G VR", "classification": 1}, {"text": "ZEISS BATIS 85/1.8 SONNAR", "classification": 1}, {"text": "SONY FE 28-70/3.5-5.6 OSS", "classification": 1}, {"text": "SIGMA 19/2.8 DC", "classification": 1}, {"text": "FUJI X70", "classification": 2}, {"text": "FUJI X-PRO2 GRAPHITE W/23/2", "classification": 2}, {"text": "CANON EF-S 18-135/3.5-5.6 IS STM", "classification": 1}, {"text": "CANON EF 70-200/2.8 L", "classification": 1}, {"text": "SIGMA 50-100/1.8 ART DC", "classification": 1}, {"text": "CANON EF 100-400/4.5-5.6 IS L", "classification": 1}, {"text": "NIKON AF-S 2X TC-20E II TELECONVERTER", "classification": 1}, {"text": "SONY RX10 III", "classification": 2}, {"text": "CANON EF-S 10-18/4.5-5.6 IS STM", "classification": 1}, {"text": "SIGMA 8-16/4.5-5.6 HSM", "classification": 1}, {"text": "CANON EF-S 18-135/3.5-5.6 IS", "classification": 1}, {"text": "SONY FE 50/2.8 MACRO", "classification": 1}, {"text": "PANASONIC 35-100/2.8", "classification": 1}, {"text": "CANON 60D", "classification": 2}, {"text": "CANON 5D CLASSIC", "classification": 2}, {"text": "CANON EF 75-300/4-5.6 III", "classification": 1}, {"text": "SIGMA 17-70/2.8-4.5 DC", "classification": 1}, {"text": "CANON EF 50/1.8 STM", "classification": 1}, {"text": "SIGMA 18-35/1.8 ART", "classification": 1}, {"text": "CANON 24-105/4 IS L", "classification": 1}, {"text": "NIKON F STANDARD", "classification": 3}, {"text": "NIKON D7000", "classification": 2}, {"text": "NIKON D5100", "classification": 2}, {"text": "NIKON AF-S 105/2.8 MACRO VR", "classification": 1}, {"text": "NIKON AF-S 10-24/3.5-4.5 DX", "classification": 1}, {"text": "SONY A7 II", "classification": 2}, {"text": "SONY A7S II", "classification": 2}, {"text": "SONY E 16-50/3.5-5.6 PZ", "classification": 1}, {"text": "OLYMPUS E-P3", "classification": 2}, {"text": "OLYMPUS E-M10", "classification": 2}, {"text": "OLYMPUS E-M10", "classification": 2}, {"text": "OLYMPUS 14-42/3.5-5.6", "classification": 1}, {"text": "PANASONIC GH4", "classification": 2}, {"text": "LEICA M 35/3.5 SUMMARON", "classification": 1}, {"text": "LEICA M 50/2 DUAL RANGE", "classification": 1}, {"text": "SONY A7R", "classification": 2}, {"text": "SONY A7S II", "classification": 2}, {"text": "The Leica M10-P Digital", "classification": 2}, {"text": "The Nikon NIKKOR Z 24-70mm f/4 S", "classification": 1}, {"text": "Nikon NIKKOR Z 50mm f/1.8 S Lens", "classification": 1}, {"text": "CANON 50D", "classification": 2}, {"text": "CANON 5D MARK IV", "classification": 2}, {"text": "CANON 7D", "classification": 2}, {"text": "CANON 5D CLASSIC", "classification": 2}, {"text": "CANON 5D MK III", "classification": 2}, {"text": "CANON 50D", "classification": 2}, {"text": "CANON REBEL T6S", "classification": 2}, {"text": "SIGMA 50/1.4 EX DG", "classification": 1}, {"text": "CANON EF-S 18-55/3.5-5.6 IS", "classification": 1}, {"text": "CANON EF 17-40/4 L", "classification": 1}, {"text": "CANON EF 50/1.8 II", "classification": 1}, {"text": "CANON EF 50/1.8 II", "classification": 1}, {"text": "CANON EF 75-300/4-5.6 III", "classification": 1}, {"text": "CANON EF-S 18-135/3.5-5.6 IS USM", "classification": 1}, {"text": "CANON EF-S 24/2.8 STM", "classification": 1}]