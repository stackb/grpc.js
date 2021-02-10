.PHONY: goldens
goldens:
	find . -name '*.prototext' | xargs rm 
	./tools/regenerate_golden_files.sh
