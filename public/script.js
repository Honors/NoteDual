var features = [
	{
		details: "First",
		heading: "I'm First"
	},
	{
		details: "Second",
		heading: "I'm Second"
	},
	{
		details: "Third",
		heading: "I'm Third"
	},
	{
		details: "Fourth",
		heading: "I'm Fourth"
	},
	{
		details: "Fifth",
		heading: "I'm Fifth"
	}
];
var sidebar = {
	"Sidebar": {
		"Link1": "#",
		"Link2": "#",
		"Link3": "#"
	},
	"Sidebar2": {
		"Link1": "#",
		"Link2": "#",
		"Link3": "#",
		"Link4": "#"
	},
	"Sidebar3": {
		"Link1": "#",
		"Link2": "#"
	}
};
var templ = function(text, data) {
	return (function() {
		for( var k in data ) {
			v = data[k];
			text = text.replace(RegExp("{{"+k+"}}","g"), v);
		}
		return text;
	})()
};