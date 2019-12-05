$("#listing-table").tabulator({
    //height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout:"fitColumns", //fit columns to width of table (optional)
    columns:[ //Define Table Columns
        {title:"Title", field:"title", formatter:"link", formatterParams:{urlField:"url"}},
        {title:"Url", field:"url", align:"left", visible:false},
        {title:"Price", field:"price", align:"left", width:150},
        {title:"Time", field:"timeonmarket", align:"left", width:100}
    ]
    /*,
    tooltips:function(cell){
        //cell - cell component

        //function should return a string for the tooltip of false to hide the tooltip
        return  cell.getColumn().getField() + " - " + cell.getValue(); //return cells "field - value";
    }
    /*
    rowClick:function(e, row){ //trigger an alert message when the row is clicked
        alert("Row " + row.getData().id + " Clicked!!!!");
    },
    */
});



$.get("/soldshort", function(data) {
        var items = [];
        $.each(data, function(i, itemData){
            console.log(itemData);
            var item = {
                //title:'<a href="'+itemData.guid+'">'+itemData.title+'</a>',
                title:itemData.title,
                url:itemData.guid,
                price: itemData.price,
                // timeonmarket: itemData.timeonmarket
            };

            if(itemData.timeonmarket < 120) {
                item.timeonmarket = itemData.timeonmarket+" s";
            } else if ((itemData.timeonmarket/60) < 60) {
                item.timeonmarket = Math.floor(itemData.timeonmarket/60) +" m";
            }


            items.push(item);
        });

        $("#listing-table").tabulator("setData", items);
    });