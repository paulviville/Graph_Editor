function Selector(map)
{
    this.create_points = (!map.vertex) ? undefined : function(params = {})
	{
		this.points_params = params;
		
		const vertex = map.vertex;
		const position = map.get_attribute(vertex, "position");
		
		if(!position)
			return false;

		const geometry = new THREE.SphereGeometry(0.05, 3, 2);
		const material = new THREE.MeshBasicMaterial({ 
			transparent: true,
			opacity: 0.25,
		});

		this.points = new THREE.Group();
		map.foreach(vertex, vd => {
			let sphere = new THREE.Mesh(geometry, material);
			sphere.position.copy( position[map.cell(vertex, vd)]);
			sphere.dart = vd;
			this.points.add(sphere);
		});

		

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