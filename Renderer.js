function Renderer(map)
{
    this.create_points = (!map.vertex) ? undefined : function(params = {})
        {
			this.points_params = params;
            const vertex = map.vertex;
			const position = map.get_attribute(vertex, "position");
			
			if(!position)
				return false;
			
            const geometry = new THREE.Geometry();
			map.foreach(vertex,
				vd => {
					geometry.vertices.push(position[map.cell(vertex, vd)])
				});
			
            let material;
            if(params.vertexColors)
            {
                const colors = params.vertexColors;
				map.foreach(vertex, 
					vd => {
						geometry.colors.push(colors[map.cell(vertex, vd)]);
					});

                material = new THREE.PointsMaterial(
                    {
                        size: params.size || 0.025,
                        vertexColors: THREE.VertexColors
                    });
            }
            else
                material = new THREE.PointsMaterial(
                    { 
                        color: params.color || 0xFF0000,
                        size: params.size || 0.0025
                    });

			this.points = new THREE.Points(geometry, material);

			this.add_points = function(parent)
				{
					parent.add(this.points);
				}
			
			this.remove_points = function()
				{
					this.points.parent.remove(this.points);
				}

			this.delete_points = function()
				{
					this.remove_points();
    				this.points.geometry.dispose();
					delete this.points;
					delete this.remove_points;
					delete this.add_points;
				}

			this.update_points = function()
				{
					let parent = this.points.parent;
					this.delete_points();
					this.create_points();
					if(parent) parent.add(this.points);
				}

			this.update_points_positions = function()
				{
					this.points.geometry.verticesNeedUpdate = true;
				}

			return true;
        }

	this.create_edges = (!map.edge) ? undefined : function(params = {})
		{
			this.edges_params = params;

			const vertex = map.vertex;
			const edge = map.edge;

			const position = map.get_attribute(vertex, "position");

			const geometry = new THREE.Geometry();
			map.foreach(edge,
				ed => {
					geometry.vertices.push(position[map.cell(vertex, ed)]);
					geometry.vertices.push(position[map.cell(vertex, map.phi1[ed])]);
				});

			let material;
			if(params.edgeColor)
			{
				const colors = params.edgeColor;
				map.foreach(edge,
					ed => {
						geometry.colors.push(colors[map.cell(edge, ed)]);
						geometry.colors.push(colors[map.cell(edge, ed)]);
					});

				material = new THREE.LineBasicMaterial(
				{
					vertexColors: THREE.VertexColors,
					linewidth: params.width || 2
				});
			}
			else
			{
				if(params.vertexColors)
				{
					const colors = params.vertexColors;
					map.foreach(edge, 
						ed => {
							geometry.colors.push(colors[map.cell(vertex, ed)]);
							geometry.colors.push(colors[map.cell(vertex, map.phi1[ed])]);
						});

					material = new THREE.LineBasicMaterial(
						{
							vertexColors: THREE.VertexColors,
							linewidth: params.width || 2
						});
				}
				else
				{
					material = new THREE.LineBasicMaterial(
						{
							color: params.color || 0x000000,
							linewidth: params.width || 2
						});
				}
			}

			this.edges = new THREE.LineSegments(geometry, material);

			this.add_edges = function(parent)
				{
					parent.add(this.edges);
				}
		
			this.remove_edges = function()
				{
					this.edges.parent.remove(this.edges);
				}

			this.delete_edges = function()
				{
					this.remove_edges();
					delete this.edges;
					delete this.remove_edges;
					delete this.add_edges;
				}

			this.update_edges = function()
				{
					let parent = this.edges.parent;
					this.delete_edges();
					this.create_edges(this.edges_params);
					if(parent) parent.add(this.edges);
				}

			this.update_edges_positions = function()
				{
					this.edges.geometry.verticesNeedUpdate = true;
				}
		}


    this.create_faces = (!map.face) ? undefined : function(params = {})
        {
            const vertex = map.vertex;
            const face = map.face;

			const position = map.get_attribute(vertex, "position");

            const geometry = new THREE.Geometry();
			geometry.vertices = position;
		
			map.foreach(face,
				fd => {
					let f_ids = [];
					map.foreach_dart_phi1(fd, d => {
						f_ids.push(map.cell(vertex, d));
					});
		
					for(let i = 2; i < f_ids.length; i++)
					{
						let f = new THREE.Face3(f_ids[0],f_ids[i-1],f_ids[i]);
						geometry.faces.push(f);

						if(map.is_embedded(face))
							f.id = map.cell(face, fd);
					}
				}
			);

            let material;
            if(params.faceColors)
            {
                const colors = params.faceColors;
                geometry.faces.forEach(f => f.color = colors[f.id].clone());
                material = new THREE.MeshBasicMaterial({
					vertexColors: THREE.FaceColors,
					side: params.side || THREE.FrontSide
				});
            }
            else
            {
                if(params.vertexColors)
                {
					const colors = params.vertexColors;
					   
                	geometry.faces.forEach(
						f => {
							f.vertexColors.push(colors[f.a]);
							f.vertexColors.push(colors[f.b]);
							f.vertexColors.push(colors[f.c]);
						});

					material = new THREE.MeshBasicMaterial(
						{
							vertexColors: THREE.VertexColors
						});
                }
				else 
					if(params.shader)
						material = params.shader;
					else
					material = new THREE.MeshLambertMaterial({
						color:params.color || 0xBBBBBB,
						side: params.side || THREE.FrontSide,
						transparent: params.transparent || false,
						opacity: params.opacity || 1
						// wireframe: true
					});
			}
			
			geometry.computeFaceNormals();

			this.faces = new THREE.Mesh(geometry, material);
			this.add_faces = function(parent)
				{
					parent.add(this.faces);
				}
		
			this.remove_faces = function()
				{
					this.faces.parent.remove(this.faces);
				}

			this.delete_faces = function()
				{
					this.remove_faces();
					delete this.faces;
					delete this.remove_faces;
					delete this.add_faces;
				}

			this.update_faces = function()
				{
					let parent = this.faces.parent;
					this.delete_faces();
					this.create_faces(params);
					if(parent) parent.add(this.faces);
				}
		}

		this.create_volumes = (!map.volumes) ? undefined : function(params = {})
        {
            const vertex = map.vertex;
            const face = map.face;
            const volume = map.volume;

			const position = map.get_attribute(vertex, "position");

            const geometry = new THREE.Geometry();
            geometry.vertices = position;
            map.foreach(volume,
                wd => {

                }
            );


			this.add_volumes = function(parent)
				{
					parent.add(this.volumes);
				}
		
			this.remove_volumes = function()
				{
					this.volumes.parent.remove(this.volumes);
				}

			this.delete_volumes = function()
				{
					this.remove_volumes();
					delete this.volumes;
					delete this.remove_volumes;
					delete this.add_volumes;
				}

			this.update_volumes = function()
				{
					let parent = this.volumes.parent;
					this.delete_volumes();
					this.create_volumes();
					if(parent) parent.add(this.volumes);
				}	
		}

		if(this.create_points == undefined)
			delete this.create_points;
		if(this.create_edges == undefined)
			delete this.create_edges;
		if(this.create_faces == undefined)
			delete this.create_faces;
		if(this.create_volumes == undefined)
			delete this.create_volumes;

	
}
