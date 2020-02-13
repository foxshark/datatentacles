const console = require('better-console');
const mysql      = require('mysql');
const config = require('config');
const connection = mysql.createConnection(config.get('dbConfig'));

connection.connect();


class shutterBrokerInventory
{
	constructor()
	{
		console.log("Creating SB inventory client");
		this.gruntWork();
		// this.importOldDatabase();
		
	}	

	gruntWork()
	{
		var self = this;
		connection.query(`
		SELECT
		belongs_json->>'$."digital-cameras".Brand[0]' as brand,
		belongs_json->>'$."digital-cameras".Type[0]' as type,
		json_data->>'$.title' as title,
		format(json_data->>'$.BuyItNowPrice'/100,2) as BuyItNowPrice,
		json_data
		FROM ebay_spider_items
		WHERE belongs_json->>'$."digital-cameras".Brand[0]' = 'Nikon'
		AND belongs_json->>'$."digital-cameras".Type[0]' = 'Digital SLR'
		LIMIT 10
		;
		`, null ,function (error, results, fields) {
			if (error) {
				throw error;
			} else {
				var items = [];
				results.forEach(function(row){
					items.push({
						brand: row.brand,
					    type: row.type,
					    model: self.parseModelName(row.title),
					    title: row.title,
					    price: row.BuyItNowPrice
					});
				})
				console.log(items);
			}
		});	
	}


	parseModelName(title)
	{
		var regex = new RegExp('((nikon) )+([a-z0-9]+)',"gi");
		var matches = title.match(regex);
		if(matches != null) {
			return matches[0];
		}
		return "";
	}
}


var sb = new shutterBrokerInventory();