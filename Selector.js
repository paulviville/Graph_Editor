function Selector(map)
{
	if(map.vertex)
		this.point_highlighter = new THREE.Mesh(
			new THREE.SphereGeometry(0.005, 16, 16),
			new THREE.MeshLambertMaterial({
				color: 0x00ee33,
				// transparent: true,
				// opacity: 0.5
			})
		);


    this.create_points = (!map.vertex) ? undefined : function(params = {})
	{
		this.points_params = params;

		const vertex = map.vertex;
		const position = map.get_attribute(vertex, "position");

		if(!position)
			return false;

		const geometry = new THREE.SphereGeometry(params.size || 0.0025, 4, 3);
		const material = new THREE.MeshBasicMaterial({
			// visible: false,
			transparent: true,
			opacity: 0.25,
		});

		this.points = new THREE.Group();
		map.foreach(vertex, vd => {
			let sphere = new THREE.Mesh(geometry, material);
			this.points.add(sphere);
			sphere.position.copy(position[map.cell(vertex, vd)]);
			sphere.dart = vd;
		});

		this.add_points = function(parent)
		{
			parent.add(this.points);
		}

		this.remove_points = function(parent)
		{
			this.edges.parent.remove(this.points);
		}

		this.delete_points = function()
		{
			if(parent) this.remove_points()
			this.points = undefined;
		}

		this.update_points = function()
		{
			let parent = this.points.parent;
			this.delete_points();
			this.create_points();
			if(parent) this.add_points(parent);
		}

		this.update_points_positions = function()
		{
			this.points.children.forEach(p => {
				p.position.copy(position[map.cell(vertex, p.dart)]);
			});
		}


		this.highlight_point = function(vd)
		{
			this.point_highlighter.dart = vd;
			this.point_highlighter.position.copy(position[map.cell(vertex, vd)]);
			this.point_highlighter.visible = true;

		}

		this.highlight_point_update = function()
		{
			this.point_highlighter.position.copy(position[map.cell(vertex, this.point_highlighter.dart)]);

		}

		this.unhighlight_point = function()
		{
			this.point_highlighter.visible = false;
		}
		this.unhighlight_point();
	}

	if(map.edge)
	this.edge_highlighter = new THREE.Mesh(
		new THREE.CylinderGeometry(0.0035, 0.0035, 1, 16),
		new THREE.MeshLambertMaterial({
			color: 0xeeee00,
			transparent: true,
			opacity: 0.5
		})
	);

	this.create_edges = (!map.edge) ? undefined : function(params = {})
	{
		this.edges_params = params;
		const vertex = map.vertex;
		const edge = map.edge;
		const position = map.get_attribute(vertex, "position");

		const geometry = new THREE.CylinderGeometry(params.size, params.size, 1, 4);
		const material = new THREE.MeshBasicMaterial({
			color: 0xff00ff,
			transparent: true,
			visible: false,
			opacity: 0.25,
		});

		this.edges = new THREE.Group();
		map.foreach(edge, ed => {
			let cylinder = new THREE.Mesh(geometry, material);
			let p0 = position[map.cell(vertex, ed)];
			let p1 = position[map.cell(vertex, map.phi1[ed])];
			let dir = new THREE.Vector3().subVectors(p0, p1);

			let len = dir.length();
			let mid = new THREE.Vector3().addVectors(p0, p1).divideScalar(2);

			let dirx = new THREE.Vector3().crossVectors(dir.normalize(), new THREE.Vector3(0,0,1));


			let dirz = new THREE.Vector3().crossVectors(dirx, dir);
			let m = new THREE.Matrix4().fromArray([
				dirx.x, dir.x, dirz.x, mid.x,
				dirx.y, dir.y, dirz.y, mid.y,
				dirx.z, dir.z, dirz.z, mid.z,
				0, 0, 0, 1]).transpose();
			cylinder.applyMatrix(m);
			cylinder.scale.set(1, len, 1);
			this.edges.add(cylinder);
			cylinder.dart = ed;
		});

		this.add_edges = function(parent)
		{
			parent.add(this.edges);
		}

		this.remove_edges = function(parent)
		{
			this.edges.parent.remove(this.edges);
		}

		this.delete_edges = function()
		{
			if(parent) this.remove_edges()
			this.edges = undefined;
		}

		this.update_edges = function()
		{
			let parent = this.edges.parent;
			this.delete_edges();
			this.create_edges();
			if(parent) this.add_edges(parent);
		}

		this.update_edges_positions = function()
		{
			this.edges.children.forEach(e => {
				let m0 = new THREE.Matrix4().getInverse(e.matrix);
				e.applyMatrix(m0);
				let ed = e.dart;
				let p0 = position[map.cell(vertex, ed)];
				let p1 = position[map.cell(vertex, map.phi1[ed])];
				let dir = new THREE.Vector3().subVectors(p0, p1);

				let len = dir.length();
				let mid = new THREE.Vector3().addVectors(p0, p1).divideScalar(2);

				let dirx = new THREE.Vector3().crossVectors(dir.normalize(), new THREE.Vector3(0,0,1));


				let dirz = new THREE.Vector3().crossVectors(dirx, dir);
				let m = new THREE.Matrix4().fromArray([
					dirx.x, dir.x, dirz.x, mid.x,
					dirx.y, dir.y, dirz.y, mid.y,
					dirx.z, dir.z, dirz.z, mid.z,
					0, 0, 0, 1]).transpose();
				e.applyMatrix(m);
				e.scale.set(1, len, 1);
			});
		}


		this.highlight_edge = function(ed)
		{
			this.edge_highlighter.dart = ed;
			this.edge_highlighter.visible = true;
			this.highlight_edge_update();
		}

		this.highlight_edge_update = function()
		{
			// this.edge_highlighter.position.copy(position[map.cell(vertex, this.edge_highlighter.dart)]);

			let m0 = new THREE.Matrix4().getInverse(this.edge_highlighter.matrix);
			this.edge_highlighter.applyMatrix(m0);
			let ed = this.edge_highlighter.dart;
			let p0 = position[map.cell(vertex, ed)];
			let p1 = position[map.cell(vertex, map.phi1[ed])];
			let dir = new THREE.Vector3().subVectors(p0, p1);

			let len = dir.length();
			let mid = new THREE.Vector3().addVectors(p0, p1).divideScalar(2);

			let dirx = new THREE.Vector3().crossVectors(dir.normalize(), new THREE.Vector3(0,0,1));


			let dirz = new THREE.Vector3().crossVectors(dirx, dir);
			let m = new THREE.Matrix4().fromArray([
				dirx.x, dir.x, dirz.x, mid.x,
				dirx.y, dir.y, dirz.y, mid.y,
				dirx.z, dir.z, dirz.z, mid.z,
				0, 0, 0, 1]).transpose();
				this.edge_highlighter.applyMatrix(m);
				this.edge_highlighter.scale.set(1, len, 1);
		}

		this.unhighlight_edge = function()
		{
			this.edge_highlighter.visible = false;
		}
		this.unhighlight_edge();
	}


	this.modify_highlighters = function (size)
	{
		if(map.vertex)
		{
			let parent =this.point_highlighter.parent;
			if(parent)
				parent.remove(this.point_highlighter);

			this.point_highlighter = new THREE.Mesh(
				new THREE.SphereGeometry(size, 16, 16),
				new THREE.MeshLambertMaterial({
					color: 0x00ee33,
					// transparent: true,
					// opacity: 0.5
				})
			);
			
			if(parent)
				parent.add(this.point_highlighter);

			this.point_highlighter.visible = false;
				
		}

		if(map.edge)
		{
			parent =this.edge_highlighter.parent;
			if(parent)
				parent.remove(this.edge_highlighter);
			this.edge_highlighter = new THREE.Mesh(
				new THREE.CylinderGeometry(size * 0.75, size * 0.75, 1, 16),
				new THREE.MeshLambertMaterial({
					color: 0xeeee00,
					transparent: true,
					opacity: 0.5
				})
			);
			if(parent)
				parent.add(this.edge_highlighter);

			this.edge_highlighter.visible = false;
		}
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