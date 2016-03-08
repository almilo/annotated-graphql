import RegexpAnnotationExtractor from './regexp-annotation-extractor';

describe('RegexpAnnotationExtractor', function () {
    describe('createCombinedExtractor()', function () {
        class ExtractorMock {
            constructor(responses) {
                this.call = 0;
                this.responses = responses;
            }

            extract(schemaText, schemaAnnotations) {
                this.call++;

                if (this.responses.length >= this.call) {
                    schemaAnnotations.push({});

                    return this.responses[this.call - 1];
                } else {
                    return schemaText;
                }
            }
        }

        it('should support passing one extractor function', function () {
            const annotations = [],
                extractor = new ExtractorMock(['type Foo {}']),
                combinedExtractor = RegexpAnnotationExtractor.createCombinedExtractor(extractor);

            const text = combinedExtractor.extract('@foo(bar: "baz") type Foo {}', annotations);

            text.should.equal('type Foo {}');
            annotations.should.be.deepEqual([{}]);
        });

        it('should call the extractor as long as it returns something', function () {
            const annotations = [],
                extractor = new ExtractorMock(['@foo(baz: "baz") type Foo {}', 'type Foo {}']),
                combinedExtractor = RegexpAnnotationExtractor.createCombinedExtractor(extractor);

            const text = combinedExtractor.extract('@foo(bar: "bar") @foo(baz: "baz") type Foo {}', annotations);

            text.should.equal('type Foo {}');
            annotations.should.be.deepEqual([{}, {}]);
        });

        it('should support passing multiple extractor functions', function () {
            const annotations = [],
                extractor1 = new ExtractorMock(['@foo(baz: "baz") type Foo {}']),
                extractor2 = new ExtractorMock(['type Foo {}']),
                combinedExtractor = RegexpAnnotationExtractor.createCombinedExtractor([extractor1, extractor2]);

            const text = combinedExtractor.extract('@foo(bar: "bar") @foo(baz: "baz") type Foo {}', annotations);

            text.should.equal('type Foo {}');
            annotations.should.be.deepEqual([{}, {}]);
        });
    });

    describe('extract()', function () {
        const regexpAnnotationExtractor = new RegexpAnnotationExtractor(
            '@(foo)\\s*\\(([\\S|\\s]*?)\\)\\s*type\\s+(.*?)\\s*\\{',
            annotations => (match, type, attributes, typeName) => {
                annotations.push(`${type}, ${attributes}, ${typeName}`);

                return `type ${typeName} {`;
            }
        );

        it('should not modify anything when the text does not match', function () {
            const annotations = [];

            const text = regexpAnnotationExtractor.extract(`foo bar`, annotations);

            text.should.be.equal('foo bar');
            annotations.should.be.empty();
        });

        it('should extract the annotation when the text matches', function () {
            const annotations = [];

            const text = regexpAnnotationExtractor.extract('@foo(bar: "baz") type Foo {}', annotations);

            text.should.equal('type Foo {}');
            annotations.should.be.deepEqual([
                'foo, bar: "baz", Foo'
            ]);
        });
    });
});
