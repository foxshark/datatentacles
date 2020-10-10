var dialog;

var table = $("#listing-table").tabulator({
// var table = new Tabulator("#listing-table", {
//         tableBuilding:function(){
//             populateGrid("type");
//     },
    //height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout:"fitColumns", //fit columns to width of table (optional)
    selectable:true, //make rows selectable
    columns:[ //Define Table Columns
        {title:"Title", field:"title"},
        {title:"Brand", field:"brand", align:"left", width:150},
        {title:"Type", field:"type", align:"left", width:150},
        {title:"Product", field:"product", align:"left", width:150},
        // {title:"Avail.", field:"available", formatter:"tickCross", width:100},
        {title:"Pass", field:"pass", align:"center", formatter:"tickCross", width:90, cellClick:function(e, cell){
            reviewClassification(cell.getRow(), 0)
            // reviewMultiClassification(0);
        }},
        {title:"Fail", field:"fail", align:"center", formatter:"tickCross", width:90, cellClick:function(e, cell){
            reviewClassification(cell.getRow(), 1)
            // reviewMultiClassification(1);
        }}

    ],
});

function reviewMultiClassification(review)
{
    var selectedRows = $("#listing-table").tabulator("getSelectedRows");
    console.log(selectedRows.length + " selected rows")
    selectedRows.forEach(function(tableRow){
        var itemId = tableRow.getData().id
        $.get("/review/"+itemId+"/"+review, function(data) {
            console.log("Item "+itemId+" has been reviewed as "+review);    
        });
        tableRow.delete();
    })
}

function reviewClassification(tableRow, review)
{
    var itemId = tableRow.getData().id
    // console.log("reviewing item "+itemId);
    $.get("/review/"+itemId+"/"+review, function(data) {
        console.log("Item "+itemId+" has been reviewed as "+review);    
    });
    tableRow.delete();
} 

dialog = $( "#dialog-form" ).dialog({
      autoOpen: false,
      height: 400,
      width: 350,
      modal: true,
      buttons: {
        "Create an account": addUser,
        Cancel: function() {
          dialog.dialog( "close" );
        }
      },
      close: function() {
        form[ 0 ].reset();
        allFields.removeClass( "ui-state-error" );
      }
    });

function addUser() {
    
}

function populateGrid(key = null){
    var url = "/grid";
    if(key != null) {
        url+= "/"+key;
    }
    $.get(url, function(data) {
        var items = [];
        $.each(data, function(i, itemData){
            console.log(itemData);
            var item = {
                //title:'<a href="'+itemData.guid+'">'+itemData.title+'</a>',
                id:itemData.id,
                title:itemData.title,
                brand:itemData.t_brand,
                type:itemData.t_type,
                product:itemData.t_product,
                pass:true
                // fail:0
                // action: `<a href="'+itemData.guid+'">pass</a>' | <a href="'+itemData.guid+'">fail</a>'`
            };

            if(itemData.soldtime > 0) {
                item.available = false;
            } else {
                item.available = true;
            }
            items.push(item);
        });

        $("#listing-table").tabulator("setData", items);
    });
}

$(document).ready(function(){
    // populateGrid("type");
    populateGrid("product");
});