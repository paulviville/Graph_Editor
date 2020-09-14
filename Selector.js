function Selector(map)
{
    this.create_points = (!map.vertex) ? undefined : function(params = {})
	{
		this.points_params = params;
		
	}

	this.create_edges = (!map.edge) ? undefined : function(params = {})
	{
		this.edges_params = params;

	}

	this.create_faces = (!map.face) ? undefined : function(params = {})
	{
		this.faces_params = params;

	}

	this.create_volumes = (!map.volumes) ? undefined : function(params = {})
	{
		this.volumes_params = params;

	}
}