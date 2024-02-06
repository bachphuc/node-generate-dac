/* This file is autogenerated from table {table_name}. Any modification will 
 * be lost once it is regenerated.
 *
 * Template         : Commands.cst
 * Generator        : {generator} 
 * Date             : {datetime}
 */
 

/****** Object:  StoredProcedure [dbo].[xhs_sp_ins_{table_name_lower}]    Script Date: {datetime} ******/
IF EXISTS (select * from dbo.sysobjects where id = object_id(N'[dbo].[xhs_sp_ins_{table_name_lower}]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
	DROP PROCEDURE [dbo].[xhs_sp_ins_{table_name_lower}]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[xhs_sp_ins_{table_name_lower}] (
	{insert_params},
	@Identity int out
)
AS
BEGIN
    
	INSERT INTO [dbo].[{table_name}]
	(
		{insert_cols}
	)
	VALUES
	(
		{insert_values}
	)
			
	SET @Identity = SCOPE_IDENTITY()
    
END 
GO

/****** Object:  StoredProcedure [dbo].[xhs_sp_upd_{table_name_lower}]    Script Date: {datetime} ******/
IF EXISTS (select * from dbo.sysobjects where id = object_id(N'[dbo].[xhs_sp_upd_{table_name_lower}]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
  DROP PROCEDURE [dbo].[xhs_sp_upd_{table_name_lower}]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[xhs_sp_upd_{table_name_lower}]
	@ID int,
  {update_params}

AS
BEGIN

	UPDATE [dbo].[{table_name}]
	SET 
		{update_values}
	WHERE [ID] = @ID

END
GO

/****** Object:  StoredProcedure [dbo].[xhs_sp_del_{table_name_lower}]    Script Date: {datetime} ******/
IF EXISTS (select * from dbo.sysobjects where id = object_id(N'[dbo].[xhs_sp_del_{table_name_lower}]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
  DROP PROCEDURE [dbo].[xhs_sp_del_{table_name_lower}]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[xhs_sp_del_{table_name_lower}]

	@ID int

AS

	DELETE [dbo].[{table_name}]
	WHERE
		[ID] = @ID
GO

/****** Object:  StoredProcedure [dbo].[xhs_sp_get_{table_name_lower}_all]    Script Date: {datetime} ******/
IF EXISTS (select * from dbo.sysobjects where id = object_id(N'[dbo].[xhs_sp_get_{table_name_lower}_all]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
DROP PROCEDURE [dbo].[xhs_sp_get_{table_name_lower}_all]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[xhs_sp_get_{table_name_lower}_all]

AS

	SELECT t1.*
    , cua.Logon_Name as CreatedByLogonName, cua.Name_First as CreatedByFirstName, cua.Name_Last as CreatedByLastName,  
		uua.Logon_Name as UpdatedByLogonName, uua.Name_First as UpdatedByFirstName, uua.Name_Last as UpdatedByLastName 
  FROM [dbo].[{table_name}] as t1
  left join [dbo].[User_Account] as cua on t1.Create_User_Account_ID = cua.ID
	left join [dbo].[User_Account] as uua on t1.Update_User_Account_ID = uua.ID
    
GO

/****** Object:  StoredProcedure [dbo].[xhs_sp_get_{table_name_lower}_by_id]    Script Date: {datetime} ******/
IF EXISTS (select * from dbo.sysobjects where id = object_id(N'[dbo].[xhs_sp_get_{table_name_lower}_by_id]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
DROP PROCEDURE [dbo].[xhs_sp_get_{table_name_lower}_by_id]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[xhs_sp_get_{table_name_lower}_by_id]

	@ID int

AS

	SELECT t1.* 
    , cua.Logon_Name as CreatedByLogonName, cua.Name_First as CreatedByFirstName, cua.Name_Last as CreatedByLastName,  
		uua.Logon_Name as UpdatedByLogonName, uua.Name_First as UpdatedByFirstName, uua.Name_Last as UpdatedByLastName 
	FROM [dbo].[{table_name}] as t1
		left join [dbo].[User_Account] as cua on t1.Create_User_Account_ID = cua.ID
		left join [dbo].[User_Account] as uua on t1.Update_User_Account_ID = uua.ID
	WHERE
		t1.[ID] = @ID
GO


