import {
	BufferGeometry,
	Color,
	Geometry,
	Line,
	Matrix3,
	Mesh,
	Points,
	Vector2,
	Vector3,
	Texture
} from '/build/three.module.js';

var OBJExporter = function () {};

OBJExporter.prototype = {

	constructor: OBJExporter,

	parse: function ( object ) {

		var output = '';

		var indexVertex = 0;
		var indexVertexUvs = 0;
		var indexNormals = 0;

		var vertex = new Vector3();
		var color = new Color();
		var normal = new Vector3();
		var uv = new Vector2();

		var i, j, k, l, m, face = [];

		var parseMesh = function ( mesh ) {

			var nbVertex = 0;
			var nbNormals = 0;
			var nbVertexUvs = 0;

			var geometry = mesh.geometry;

			var normalMatrixWorld = new Matrix3();

			if ( geometry instanceof Geometry ) {

				geometry = new BufferGeometry().setFromObject( mesh );

			}

			if ( geometry instanceof BufferGeometry ) {

				// shortcuts
				var vertices = geometry.getAttribute( 'position' );
				var normals = geometry.getAttribute( 'normal' );
				var uvs = geometry.getAttribute( 'uv' );
				var indices = geometry.getIndex();

				// name of the mesh object
				output += 'o ' + mesh.name + '\n';

				// name of the mesh material
				if ( mesh.material && mesh.material.name ) {

					output += 'usemtl ' + mesh.material.name + '\n';

				}

				// vertices

				if ( vertices !== undefined ) {

					for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

						vertex.x = vertices.getX( i );
						vertex.y = vertices.getY( i );
						vertex.z = vertices.getZ( i );

						// transform the vertex to world space
						vertex.applyMatrix4( mesh.matrixWorld );

						// transform the vertex to export format
						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

					}

				}

				// uvs

				if ( uvs !== undefined ) {

					for ( i = 0, l = uvs.count; i < l; i ++, nbVertexUvs ++ ) {

						uv.x = uvs.getX( i );
						uv.y = uvs.getY( i );

						// transform the uv to export format
						output += 'vt ' + uv.x + ' ' + uv.y + '\n';

					}

				}

				// normals

				if ( normals !== undefined ) {

					normalMatrixWorld.getNormalMatrix( mesh.matrixWorld );

					for ( i = 0, l = normals.count; i < l; i ++, nbNormals ++ ) {

						normal.x = normals.getX( i );
						normal.y = normals.getY( i );
						normal.z = normals.getZ( i );

						// transform the normal to world space
						normal.applyMatrix3( normalMatrixWorld ).normalize();

						// transform the normal to export format
						output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';

					}

				}

				// faces

				if ( indices !== null ) {

					for ( i = 0, l = indices.count; i < l; i += 3 ) {

						for ( m = 0; m < 3; m ++ ) {

							j = indices.getX( i + m ) + 1;

							face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

						}

						// transform the face to export format
						output += 'f ' + face.join( ' ' ) + '\n';

					}

				} else {

					for ( i = 0, l = vertices.count; i < l; i += 3 ) {

						for ( m = 0; m < 3; m ++ ) {

							j = i + m + 1;

							face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

						}

						// transform the face to export format
						output += 'f ' + face.join( ' ' ) + '\n';

					}

				}

			} else {

				console.warn( 'OBJExporter.parseMesh(): geometry type unsupported', geometry );

			}

			// update index
			indexVertex += nbVertex;
			indexVertexUvs += nbVertexUvs;
			indexNormals += nbNormals;

		};

		var parseLine = function ( line ) {

			var nbVertex = 0;

			var geometry = line.geometry;
			var type = line.type;

			if ( geometry instanceof Geometry ) {

				geometry = new BufferGeometry().setFromObject( line );

			}

			if ( geometry instanceof BufferGeometry ) {

				// shortcuts
				var vertices = geometry.getAttribute( 'position' );

				// name of the line object
				output += 'o ' + line.name + '\n';

				if ( vertices !== undefined ) {

					for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

						vertex.x = vertices.getX( i );
						vertex.y = vertices.getY( i );
						vertex.z = vertices.getZ( i );

						// transform the vertex to world space
						vertex.applyMatrix4( line.matrixWorld );

						// transform the vertex to export format
						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

					}

				}

				if ( type === 'Line' ) {

					output += 'l ';

					for ( j = 1, l = vertices.count; j <= l; j ++ ) {

						output += ( indexVertex + j ) + ' ';

					}

					output += '\n';

				}

				if ( type === 'LineSegments' ) {

					for ( j = 1, k = j + 1, l = vertices.count; j < l; j += 2, k = j + 1 ) {

						output += 'l ' + ( indexVertex + j ) + ' ' + ( indexVertex + k ) + '\n';

					}

				}

			} else {

				console.warn( 'OBJExporter.parseLine(): geometry type unsupported', geometry );

			}

			// update index
			indexVertex += nbVertex;

		};

		var parsePoints = function ( points ) {

			var nbVertex = 0;

			var geometry = points.geometry;

			if ( geometry instanceof Geometry ) {

				geometry = new BufferGeometry().setFromObject( points );

			}

			if ( geometry instanceof BufferGeometry ) {

				var vertices = geometry.getAttribute( 'position' );
				var colors = geometry.getAttribute( 'color' );

				output += 'o ' + points.name + '\n';

				if ( vertices !== undefined ) {

					for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

						vertex.fromBufferAttribute( vertices, i );
						vertex.applyMatrix4( points.matrixWorld );

						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z;

						if ( colors !== undefined ) {

							color.fromBufferAttribute( colors, i );

							output += ' ' + color.r + ' ' + color.g + ' ' + color.b;

						}

						output += '\n';

					}

				}

				output += 'p ';

				for ( j = 1, l = vertices.count; j <= l; j ++ ) {

					output += ( indexVertex + j ) + ' ';

				}

				output += '\n';

			} else {

				console.warn( 'OBJExporter.parsePoints(): geometry type unsupported', geometry );

			}

			// update index
			indexVertex += nbVertex;

		};

		object.traverse( function ( child ) {

			if ( child instanceof Mesh ) {

				parseMesh( child );

			}

			if ( child instanceof Line ) {

				parseLine( child );

			}

			if ( child instanceof Points ) {

				parsePoints( child );

			}

		} );

		return output;

	}

};

var OBJExporterWithMtl = function (mtlFileName) {
	this.mtlFileName = mtlFileName
};

OBJExporterWithMtl.prototype = {

	constructor: OBJExporterWithMtl,

	parse: function ( object ) {

	var output = '';
		var materials = {};

		var indexVertex = 0;
		var indexVertexUvs = 0;
		var indexNormals = 0;
      	
	// var mtlFileName = 'objmaterial'; // maybe this value can be passed as parameter
	output += 'mtllib ' + this.mtlFileName +  '.mtl\n';

		var parseMesh = function ( mesh ) {

			var nbVertex = 0;
			var nbVertexUvs = 0;
			var nbNormals = 0;

			var geometry = mesh.geometry;
			var material = mesh.material;

			if ( geometry instanceof Geometry ) {

				output += 'o ' + mesh.name + '\n';

				var vertices = geometry.vertices;

				for ( var i = 0, l = vertices.length; i < l; i ++ ) {

					var vertex = vertices[ i ].clone();
					vertex.applyMatrix4( mesh.matrixWorld );

					output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

					nbVertex ++;

				}

				// uvs

				var faces = geometry.faces;
				var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
				var hasVertexUvs = faces.length === faceVertexUvs.length;

				if ( hasVertexUvs ) {

					for ( var i = 0, l = faceVertexUvs.length; i < l; i ++ ) {

						var vertexUvs = faceVertexUvs[ i ];

						for ( var j = 0, jl = vertexUvs.length; j < jl; j ++ ) {

							var uv = vertexUvs[ j ];

							output += 'vt ' + uv.x + ' ' + uv.y + '\n';

							nbVertexUvs ++;

						}

					}

				}

				// normals

				var normalMatrixWorld = new Matrix3();
				normalMatrixWorld.getNormalMatrix( mesh.matrixWorld );

				for ( var i = 0, l = faces.length; i < l; i ++ ) {

					var face = faces[ i ];
					var vertexNormals = face.vertexNormals;

					if ( vertexNormals.length === 3 ) {

						for ( var j = 0, jl = vertexNormals.length; j < jl; j ++ ) {

							var normal = vertexNormals[ j ].clone();
							normal.applyMatrix3( normalMatrixWorld );

							output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';

							nbNormals ++;

						}

					} else {

						var normal = face.normal.clone();
						normal.applyMatrix3( normalMatrixWorld );

						for ( var j = 0; j < 3; j ++ ) {

							output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';

							nbNormals ++;

						}

					}

				}
              
			// material
              
			if (material.name !== '')
				output += 'usemtl ' + material.name + '\n';
			else
				output += 'usemtl material' + material.id + '\n';
              
			materials[material.id] = material;

				// faces


				for ( var i = 0, j = 1, l = faces.length; i < l; i ++, j += 3 ) {

					var face = faces[ i ];

					output += 'f ';
					output += ( indexVertex + face.a + 1 ) + '/' + ( hasVertexUvs ? ( indexVertexUvs + j     ) : '' ) + '/' + ( indexNormals + j     ) + ' ';
					output += ( indexVertex + face.b + 1 ) + '/' + ( hasVertexUvs ? ( indexVertexUvs + j + 1 ) : '' ) + '/' + ( indexNormals + j + 1 ) + ' ';
					output += ( indexVertex + face.c + 1 ) + '/' + ( hasVertexUvs ? ( indexVertexUvs + j + 2 ) : '' ) + '/' + ( indexNormals + j + 2 ) + '\n';

				}

			} else {

				console.warn( 'OBJExporter.parseMesh(): geometry type unsupported', mesh );
				// TODO: Support only BufferGeometry and use use setFromObject()

			}

			// update index
			indexVertex += nbVertex;
			indexVertexUvs += nbVertexUvs;
			indexNormals += nbNormals;

		};

		object.traverse( function ( child ) {

			if ( child instanceof Mesh ) parseMesh( child );

		} );
      		
	// mtl output
      
	var mtlOutput = '';
      
	for (var key in materials) {
        
		var mat = materials[key];
          
		if (mat.name !== '')
			mtlOutput += 'newmtl ' + mat.name + '\n';
		else
			mtlOutput += 'newmtl material' + mat.id + '\n';
          
		mtlOutput += 'Ns 10.0000\n';
		mtlOutput += 'Ni 1.5000\n';
		mtlOutput += 'd 1.0000\n';
		mtlOutput += 'Tr 0.0000\n';
		mtlOutput += 'Tf 1.0000 1.0000 1.0000\n';
		mtlOutput += 'illum 2\n';
		mtlOutput += 'Ka ' + mat.color.r + ' ' + mat.color.g + ' ' + mat.color.b + ' ' + '\n';
		mtlOutput += 'Kd ' + mat.color.r + ' ' + mat.color.g + ' ' + mat.color.b + ' ' + '\n';
		mtlOutput += 'Ks 0.0000 0.0000 0.0000\n';
		mtlOutput += 'Ke 0.0000 0.0000 0.0000\n';
          
		if (mat.map && mat.map instanceof Texture) {
          
          console.log(mat.map.image.currentSrc.lastIndexOf("/"))
			var file = mat.map.image.currentSrc.slice( mat.map.image.currentSrc.lastIndexOf("/")+1, mat.map.image.currentSrc.length );
            
			mtlOutput += 'map_Ka ' + file + '\n';
			mtlOutput += 'map_Kd ' + file + '\n';
            
		}
          
	}

	return {
		obj: output,
		mtl: mtlOutput
	}

	}

};

export { OBJExporter, OBJExporterWithMtl };