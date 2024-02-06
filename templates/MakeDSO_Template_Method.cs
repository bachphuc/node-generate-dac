		public {table_name} MakeDB_{class_name}({class_name} ds{class_name})
		{
			XHS.DataAccess.{table_name} db{class_name} = new XHS.DataAccess.{table_name}();
			
			{db_fields}

			return db{class_name};
		}

		public XHS.DataServicesObjects.{class_name} MakeDSO_{class_name}(XHS.DataAccess.{table_name} db{class_name})
		{
			if (db{class_name} == null) return null;

			XHS.DataServicesObjects.{class_name} ds{class_name} = new XHS.DataServicesObjects.{class_name}();

			{dso_fields}

			return ds{class_name};
		}