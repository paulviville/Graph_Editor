//Attributes_Containers : handles creation of attributes ([]  + {remove()})

function Attribute(array, attributes_container, name, length)
{
	array.name = name;
	array.length = length;
	array.delete = function()
		{
			attributes_container.remove_attribute(this.name);
			this.length = 0;
			this.delete = function(){};
			this.name = "";
		}
	return array;
}

function Attributes_Container()
{
	let free_indices = new Set();
	let attributes = {};
	let nb_elements = 0;
	let refs;

	this.create_attribute = function(name = "")
		{
			while(name == "" || attributes[name])
			name += "_";

			let attribute = new Attribute([], this, name, nb_elements);
			attributes[name] = attribute;
			
			return attribute;
		}

	this.remove_attribute = function(name)
		{
			attributes[name].length = 0;
			delete attributes[name];
		}

	this.get_attribute = function(name)
		{
				return (attributes[name]? attributes[name] : undefined);
		}

	this.new_element = function()
		{
			let index;
			if(free_indices.size)
			{
				let id = free_indices.values().next().value;
				free_indices.delete(id);
				index = id;
			}
			else
			{
				Object.values(attributes).forEach(
					attribute => ++(attribute.length)
				);
				index = nb_elements++;
			}
			refs[index] = 0;
			return index;
		}

	this.delete_element = function(index)
		{
			refs[index] = null;
			free_indices.add(index);
		},

	this.nb_elements = function()
		{
			return nb_elements - free_indices.size;
		}

	this.nb_attributes = function()
		{
			return Object.keys(attributes).length;
		}

	this.delete = function()
		{
			free_indices.clear();
			nb_elements = 0;
			Object.keys(attributes).forEach(attr => this.remove_attribute(attr));
		}

	this.ref = function(index)
		{
			++refs[index];
		}

	this.unref = function(index)
		{
			if(!refs[index])
				return; 
			if(!(--refs[index])) 
				this.delete_element(index);
		}

	this.show_info = function()
		{
			console.log("nb_elements: ", nb_elements);
			console.log("nb_attributes: ", this.nb_attributes());
			console.log("free_ids: ", free_indices.size, free_indices);
			console.log("attributes", attributes);
		}

	this.show_refs = function()
		{
			console.log(refs);
		}

	refs = this.create_attribute("<refs>");
	this.refs = refs;
}
